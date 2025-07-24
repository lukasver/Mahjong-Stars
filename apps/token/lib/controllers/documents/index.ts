import 'server-only';
import { env } from '@/common/config/env';
import { DocumensoSdk } from '@/lib/documents/documenso';
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

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

class DocumentsController {
  private documenso: DocumensoSdk;
  private s3: S3Client;
  private bucket: string = env.R2_BUCKET;

  constructor() {
    this.documenso = new DocumensoSdk(env);
    this.s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      },
    });
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
    console.debug('🚀 ~ index.ts:41 ~ dto:', dto);
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
    expiresIn: number = 3600,
    metadata?: Record<string, string>
  ) {
    try {
      const res = await getSignedUrl(
        this.s3,
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Metadata: metadata,
        }),
        { expiresIn }
      );

      return Success({ url: res });
    } catch (e) {
      logger(e);
      return Failure(e);
    }
  }

  async generatePDF(reference: string, content: string) {}

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

export default new DocumentsController();
