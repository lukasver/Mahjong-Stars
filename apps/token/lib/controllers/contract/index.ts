import 'server-only';
import { ActionCtx } from '@/common/schemas/dtos/sales';
import { Failure, Success } from '@/common/schemas/dtos/utils';
import { prisma } from '@/db';
import logger from '@/services/logger.server';
import { invariant } from '@epic-web/invariant';
import { SaleStatus } from '@prisma/client';
import { DocumensoSdk } from '@/lib/documents/documenso';
import { env } from '@/common/config/env';
import { DocumensoStatusToContractStatusMapping } from '@/common/schemas/dtos/contracts';

class ContractController {
  private documenso: DocumensoSdk;

  constructor() {
    this.documenso = new DocumensoSdk(env);
  }

  async getContract(_dto: unknown, ctx: ActionCtx) {
    const { userId } = ctx;

    try {
      const sale = await prisma.sale.findFirst({
        where: { status: SaleStatus.OPEN },
        select: {
          id: true,
        },
      });
      invariant(sale, 'Sale not found or not open');

      const existingContract = await prisma.contractStatus.findFirst({
        where: { userId: userId as string, saleId: sale.id },
      });

      if (existingContract) {
        return Success({ contractStatus: existingContract });
      } else {
        return Success(null);
      }
    } catch (e) {
      logger(e);
      return Failure(e);
    }
  }

  async createContractStatus(dto: { contractId: string }, ctx: ActionCtx) {
    const { userId } = ctx;
    const { contractId } = dto;
    invariant(userId, 'Missing userId');
    try {
      const sale = await prisma.sale.findFirst({
        where: { status: SaleStatus.OPEN },
        select: {
          id: true,
        },
      });

      invariant(sale, 'Sale not found or not open');
      const { id: saleId } = sale;

      const newContract = await prisma.contractStatus.create({
        data: {
          userId: userId,
          saleId: saleId,
          contractId: contractId,
          status: 'PENDING',
        },
      });
      return Success({ contractStatus: newContract });
    } catch (e) {
      logger(e);
      return Failure(e);
    }
  }

  async deleteContractStatus(dto: { userId: string }, _ctx: ActionCtx) {
    const { userId } = dto;

    try {
      const existingContracts = await prisma.contractStatus.deleteMany({
        where: {
          userId,
        },
      });
      invariant(existingContracts.count > 0, 'Contracts not found');
      return Success({ message: 'Contracts deleted' });
    } catch (e) {
      logger(e);
      return Failure(e);
    }
  }

  async confirmSignature(dto: { id: string }, ctx: ActionCtx) {
    const recipient = await prisma.documentRecipient.findUniqueOrThrow({
      where: {
        user: {
          id: ctx.userId,
        },
        id: dto.id,
      },
    });

    let status = recipient.status;

    if (
      (status === 'SENT_FOR_SIGNATURE' ||
        status === 'WAITING_FOR_COUNTERPARTY' ||
        status === 'CREATED') &&
      recipient.externalId
    ) {
      // Check status on provider in case webhook failed
      const document = await this.documenso.documents
        .get({
          documentId: recipient.externalId,
        })
        .catch((e) => {
          logger(e);
          return null;
        });

      if (document) {
        let mapped = DocumensoStatusToContractStatusMapping[document.status];
        const signer = document.recipients.find((r) => r.role === 'SIGNER');

        console.debug('🚀 ~ index.ts:127 ~ signer:', signer);

        if (signer?.signingStatus === 'SIGNED') {
          mapped = 'SIGNED';
        }
        if (mapped !== status) {
          await prisma.documentRecipient.update({
            where: { id: recipient.id },
            data: { status: mapped },
          });
        }
        if (mapped) {
          status = mapped;
        }
      }
    }

    return Success({ recipient: { ...recipient, status } });
  }
}

export default new ContractController();
