import 'server-only';
import mime from 'mime-types';
import { env } from '@/common/config/env';
import sanitizeHtml from 'sanitize-html';
import { ActionCtx } from '@/common/schemas/dtos/sales';
import { prisma } from '@/db';
import { Failure, Success } from '@/common/schemas/dtos/utils';
import logger from '@/lib/services/logger.server';
import Handlebars from 'handlebars';
import { invariant } from '@epic-web/invariant';
import { DateTime } from 'luxon';
import {
  extensions,
  JSONContent,
  generateHTML,
} from '@mjs/utils/server/tiptap';
import { StorageService } from './storage';
import { z } from 'zod';
import { KycStatusSchema } from '@/common/schemas/generated';
import { Prisma } from '@prisma/client';

class DocumentsController {
  private s3: StorageService;
  private buckets: {
    public: string;
    private: string;
  } = {
    public: env.PUBLIC_BUCKET,
    private: env.PRIVATE_BUCKET,
  };

  constructor(private readonly storage: StorageService) {
    this.s3 = this.storage;
  }

  // this.service.getDocumentPresignedUrl(user, payload)
  // this.service.createSignableDocumentFromJsonContent(user, payload)
  /**
   * Create a template for a signable document. This helps AM creates a template that cannot be generated in Documenso yet due to missing variables.
   * @param user
   * @param dto
   * @returns
   */
  async createSaft(
    dto: {
      content: string | JSONContent;
      name: string;
      description?: string;
      saleId: string;
    },
    _ctx: ActionCtx
  ) {
    console.group('content');
    console.log(JSON.stringify(dto.content));
    console.groupEnd();

    try {
      invariant(dto.saleId, 'Sale ID is required');
      invariant(dto.content, 'Content is required');
      const newSaft = await prisma.$transaction(async (tx) => {
        // Check if sale already has a saft
        const sale = await tx.sale.findUnique({
          where: {
            id: dto.saleId,
          },
          select: {
            name: true,
            saftContract: {
              select: {
                id: true,
                version: true,
                parentId: true,
                isCurrent: true,
              },
            },
          },
        });
        const existingSaft = sale?.saftContract;
        // Create saft in Database

        const newVersion = (existingSaft?.version || 0) + 1;
        const variables = this.extractHandlebarsVariables(dto.content);
        const newSaft = await prisma.saftContract.create({
          data: {
            name:
              dto.name ||
              `${sale?.name} SAFT v${newVersion} - ${DateTime.now().toFormat(
                'yyyy-MM-dd'
              )}`,
            description: dto.description,
            content: dto.content,
            isCurrent: true,
            version: newVersion,
            // Always set the parentId to the original SAFT.
            parentId:
              newVersion === 1
                ? null
                : existingSaft?.parentId || existingSaft?.id,
            Sale: {
              connect: {
                id: dto.saleId,
              },
            },
            variables,
          },
        });

        // Need to update the existing saft to be not current
        if (existingSaft) {
          await tx.saftContract.update({
            where: {
              id: existingSaft.id,
            },
            data: {
              isCurrent: {
                set: false,
              },
              saleId: null,
            },
          });
        }
        return newSaft;
      });

      return Success({ saft: newSaft });
    } catch (e) {
      logger(e);
      return Failure(e);
    }
  }
  // this.service.getTemplateData(user, uids)
  // this.service.getTemplatePreview(user, uid)

  // this.service.uploadDocument(payload, file)
  // this.service.addDocumentRecipients(uid, payload, user)
  // this.service.getDocumentRecipients(uid, user)
  // this.service.sendForDocumentSigning(user, uid, payload)
  // this.service.downloadDocument(uid)
  // this.service.sendRecipientReminder(user, uid)

  /**
   *
   * @param key - file name with extension.
   * @param expiresIn
   * @returns
   */
  async getPresignedUrl(
    key: string,
    bucket: 'public' | 'private',
    type: 'read' | 'write',
    expiresIn: number = 3600
    // metadata?: Record<string, string>
  ) {
    try {
      let url: string = '';
      if (type === 'read') {
        url = await this.s3.generateReadSignedUrl(bucket, key, {
          expires: expiresIn,
        });
      }

      if (type === 'write') {
        url =
          (
            await this.s3.getPresignedUrlForUpload({
              bucket,
              fileName: key,
              expiresInMinutes: expiresIn / 60,
            })
          )?.url || '';
      }
      return Success({ url });
    } catch (e) {
      logger(e);
      return Failure(e);
    }
  }

  async generatePDF(args: {
    content: string;
    title: string;
    recipients: Array<{
      email: string;
      name?: string;
    }>;
    reference: string;
  }) {
    const res = await fetch(env.PDF_SERVICE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.PDF_SERVICE_API_KEY,
      },
      body: JSON.stringify(args),
    });
    if (!res.ok) {
      throw new Error(`Failed to generate PDF: ${res.statusText}`);
    }
    return res.json();
  }

  async associateDocumentsToUser(
    dto: {
      documents: {
        id?: string;
        key: string;
      }[];
      type: 'KYC' | 'PAYMENT';
      transactionId?: string;
    },
    _ctx: ActionCtx
  ) {
    const { documents, type = 'KYC' } = dto;
    const { userId } = _ctx;

    const shouldUpsert = z
      .object({
        id: z.string(),
        key: z.string(),
      })
      .array()
      .safeParse(documents);

    // If ID is present, we should update
    if (shouldUpsert.success) {
      const [docs] = await Promise.all([
        documents.map((d) => {
          return prisma.document.update({
            where: {
              id: d.id,
            },
            data: {
              fileName: d.key,
              type: mime.lookup(d.key) || 'application/octet-stream',
              name: d.key.split('/').pop() || '',
              url: this.s3.getFileUrl('private', d.key),
            },
          });
        }),
      ]);
      return Success({ documents: docs });
    } else {
      // Else we should create
      const promises = [];
      promises.push(
        prisma.document.createManyAndReturn({
          data: documents.map((d) => {
            const url = this.s3.getFileUrl('private', d.key);
            console.log('URL', url, d.key);
            return {
              userId,
              fileName: d.key,
              type: mime.lookup(d.key) || 'application/octet-stream',
              name: d.key.split('/').pop() || '',
              url: this.s3.getFileUrl('private', d.key),
            } satisfies Prisma.DocumentCreateManyInput;
          }),
          skipDuplicates: true,
        })
      );
      if (type === 'KYC') {
        promises.push(
          prisma.kycVerification.upsert({
            where: {
              userId,
            },
            create: {
              user: {
                connect: {
                  id: userId,
                },
              },
              status: KycStatusSchema.enum.SUBMITTED,
            },
            update: {
              status: KycStatusSchema.enum.SUBMITTED,
            },
          })
        );
      }
      if (type === 'PAYMENT') {
        const doc = documents[0];
        if (dto.transactionId && doc) {
          void prisma.saleTransactions.update({
            where: { id: dto.transactionId },
            data: { paymentEvidenceId: doc.id },
          });
        }
        //TODO check fi we want to associate something or if it is enought with linking to user
      }
      const [docs] = await Promise.all(promises);
      return Success({ documents: docs });
    }
  }

  private generateHTMLFromJSONContent = (content: JSONContent) => {
    if (!content || typeof content !== 'object') {
      return '';
    }
    try {
      return generateHTML(content, extensions);
    } catch (error) {
      console.error('Error generating HTML from JSON content:', error);
      return '';
    }
  };

  private sanitizeHtmlContent = (
    _content: string | JSONContent,
    textOnly = true
  ) => {
    const parsed: string = '';
    let content: string = '';
    if (!_content) {
      return parsed;
    }
    if (typeof _content === 'object') {
      content = this.generateHTMLFromJSONContent(_content);
    } else {
      content = _content;
    }

    return sanitizeHtml(content, {
      allowedTags: textOnly ? [] : [], // empty array means strip all HTML tags, todo add allowed tags
      allowedAttributes: {}, // no attributes allowed
      textFilter: function (text: string) {
        return text.trim(); // trim whitespace
      },
    });
  };

  /**
   * Recursively walk the Handlebars AST and collect variable names.
   * @param node The current AST node.
   * @param variables The set to collect variable names.
   */
  private collectVariablesFromDocument(node: any, variables: Set<string>) {
    if (!node || typeof node !== 'object') return;

    // Handle {{variable}} and {{{variable}}}
    if (
      node.type === 'MustacheStatement' ||
      node.type === 'SubExpression' ||
      node.type === 'BlockStatement' ||
      node.type === 'PartialStatement' ||
      node.type === 'PartialBlockStatement' ||
      node.type === 'DecoratorBlock' ||
      node.type === 'Decorator'
    ) {
      if (node.path && node.path.original) {
        variables.add(node.path.original);
      }
    }

    if (node.type === 'ContentStatement' && node.value) {
      // No variable here, just content
    }

    // Recursively process child nodes
    for (const key in node) {
      if (Array.isArray(node[key])) {
        node[key].forEach((child: any) =>
          this.collectVariablesFromDocument(child, variables)
        );
      } else if (typeof node[key] === 'object' && node[key] !== null) {
        this.collectVariablesFromDocument(node[key], variables);
      }
    }
  }

  /**
   * Extract all variable names from a Handlebars template string.
   * @param template The Handlebars template string.
   * @returns Array of variable names.
   */
  private extractHandlebarsVariables(template: JSONContent | string): string[] {
    let stringifiedTemplate = '';
    if (typeof template === 'string') {
      stringifiedTemplate = template;
    } else {
      stringifiedTemplate = this.generateHTMLFromJSONContent(template);
    }

    const ast = Handlebars.parse(stringifiedTemplate);
    const variables = new Set<string>();
    this.collectVariablesFromDocument(ast, variables);
    return Array.from(variables);
  }
}

export default new DocumentsController(new StorageService());
