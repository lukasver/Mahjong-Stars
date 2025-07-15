import {
  ContractStatus,
  Profile,
  Sale,
  SaleInformation,
  SaleTransactions,
  User,
} from '@prisma/client';
import HttpStatusCode from '../controllers/httpStatusCodes';

export interface GetTransactionsRes {
  transactions: SaleTransactions[];
  quantity: number;
  success: true;
}

export type TransactionsWithUserAndSale = SaleTransactions & {
  user: User & { profile: { email: Profile['email'] } };
  sale: Sale;
};

export interface getAdminTransactions {
  transactions: TransactionsWithUserAndSale[];
  quantity: number;
}

export interface UpdateAdminTransactionRes {
  transaction: TransactionsWithUserAndSale;
  success: true;
}

export interface GetTransactionRes {
  transactions: SaleTransactions[];
  success: true;
}

export interface UpdateTransactionRes {
  transaction: SaleTransactions;
  success: true;
}
export interface DeleteTransactionRes {
  success: true;
}

export interface CreateTransactionRes {
  agreement?: string;
  urlSign?: string;
  isSign?: boolean;
  transaction: SaleTransactions;
  success: true;
  status: HttpStatusCode;
}

export interface UpdateContractStatusRes {
  contractStatus: ContractStatus;
  success: true;
}

export interface ContractStatusRes {
  isSign: boolean | null;
  urlSign: string | null;
}

export interface GetSalesRes {
  sales: Sale[];
  quantity: number;
  success: true;
}

export interface GetSaleRes {
  sale: Sale;
  saleInformation: SaleInformation;
  success: true;
}

export interface ActiveSaleRes {
  sales: (Sale & {
    saleInformation: Omit<SaleInformation, 'uuid' | 'createdAt' | 'updatedAt'>;
  })[];
  success: true;
}

export type ActiveSale = ActiveSaleRes['sales'][number];

export interface CreateSaleRes {
  sale: Sale;
  success: true;
}
export interface CreateSaleInformationRes {
  saleInformation: SaleInformation;
  success: true;
}

export interface UpdateSaleRes {
  sale: Sale;
  success: true;
}

export interface DeleteSaleRes {
  uuid: string;
  success: true;
}
export interface PageInfo {
  pageNumber: number;
  limit: number;
}
