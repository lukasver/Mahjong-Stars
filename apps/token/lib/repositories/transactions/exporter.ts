import 'server-only';
import { ActionCtx } from '@/common/schemas/dtos/sales';
import { Failure, Success } from '@/common/schemas/dtos/utils';
import { prisma } from '@/db';
import logger from '@/lib/services/logger.server';
import { invariant } from '@epic-web/invariant';
import { utils, write } from 'xlsx';

export class TransactionsExporter {
  /**
   * Export transactions to CSV/XLSX format
   */
  async export(
    { format, saleId }: { format: 'csv' | 'xlsx'; saleId?: string },
    ctx: ActionCtx
  ) {
    try {
      invariant(ctx.isAdmin, 'Forbidden');

      const whereClause = saleId ? { saleId } : {};

      const transactions = await prisma.saleTransactions.findMany({
        where: whereClause,
        include: {
          sale: {
            select: {
              id: true,
              name: true,
              tokenSymbol: true,
              currency: true,
              requiresKYC: true,
              saftCheckbox: true,
            },
          },
          user: {
            select: {
              walletAddress: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
              kycVerification: {
                select: {
                  status: true,
                  documents: {
                    select: {
                      id: true,
                      url: true,
                      fileName: true,
                    },
                  },
                },
              },
            },
          },
          approver: {
            select: {
              walletAddress: true,
              email: true,
            },
          },
          blockchain: {
            select: {
              name: true,
              chainId: true,
            },
          },
          agreement: {
            select: {
              id: true,
              externalId: true,
              status: true,
            },
          },
        },

        orderBy: { createdAt: 'desc' },
      });
      invariant(transactions, 'No transactions found');

      const exportData = transactions.map((tx) => ({
        'Transaction ID': tx.id,
        'Sale ID': tx.sale.id,
        'Sale Name': tx.sale.name,
        'Token Symbol': tx.sale.tokenSymbol,
        'User Wallet': tx.user.walletAddress,
        'User Name':
          `${tx.user.profile?.firstName || ''} ${tx.user.profile?.lastName || ''}`.trim(),
        Quantity: tx.quantity.toString(),
        'Price Per Unit': tx.price.toString(),
        'Total Amount': tx.totalAmount.toString(),
        Currency: tx.sale.currency,
        'Form of Payment': tx.formOfPayment,
        Status: tx.status,
        'Receiving Wallet': tx.receivingWallet || '',
        'Transaction Hash': tx.txHash || '',
        Blockchain: tx.blockchain?.name || '',
        'Amount Paid': tx.amountPaid || '',
        'Paid Currency': tx.paidCurrency || '',
        'Payment Date': tx.paymentDate
          ? new Date(tx.paymentDate).toISOString()
          : '',
        'Approved By': tx.approver?.email || '',
        'Rejection Reason': tx.rejectionReason || '',
        Comment: tx.comment || '',
        'Created At': new Date(tx.createdAt).toISOString(),
        'Updated At': new Date(tx.updatedAt).toISOString(),
        'Requires KYC': tx.sale.requiresKYC ? 'Yes' : 'No',
        'Saft ID': tx.agreement?.id || '',
        'Saft Status': tx.agreement?.status || '',
        'Saft External ID': tx.agreement?.externalId?.toString() || '',
        'KYC Status': tx.user.kycVerification?.status || '',
        'KYC Documents': tx.user.kycVerification?.documents?.length
          ? `\"${tx.user.kycVerification?.documents
              .map((doc) => doc.fileName)
              .join(', ')}\"`
          : '',
      }));

      if (format === 'csv') {
        const csvContent = this.convertToCSV(exportData);
        return Success({
          data: csvContent,
          filename: `transactions_${saleId ? `sale_${saleId}_` : ''}${new Date().toISOString().split('T')[0]}.csv`,
          contentType: 'text/csv',
        });
      } else {
        const workbook = utils.book_new();
        const worksheet = utils.json_to_sheet(exportData);
        utils.book_append_sheet(workbook, worksheet, 'Transactions');

        const buffer = write(workbook, {
          type: 'buffer',
          bookType: 'xlsx',
        });
        return Success({
          data: buffer,
          filename: `transactions_${saleId ? `sale_${saleId}_` : ''}${new Date().toISOString().split('T')[0]}.xlsx`,
          contentType:
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
      }
    } catch (e) {
      logger(e);
      return Failure(e);
    }
  }

  /**
   * Convert data to CSV format
   */
  private convertToCSV(data: Record<string, string>[]): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0] || {});
    const csvRows = [
      headers.join(','),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header] || '';
            // Escape quotes and wrap in quotes if contains comma or newline
            const escaped = value.toString().replace(/"/g, '""');
            return escaped.includes(',') ||
              escaped.includes('\n') ||
              escaped.includes('"')
              ? `"${escaped}"`
              : escaped;
          })
          .join(',')
      ),
    ];

    return csvRows.join('\n');
  }
}
