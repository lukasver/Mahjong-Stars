'use server';
import 'server-only';
import { CreateContractStatusDto } from '@/common/schemas/dtos/contracts';
import { GetSaleDto, GetSalesDto } from '@/common/schemas/dtos/sales';
import {
  GetTransactionDto,
  UpdateTransactionDto,
} from '@/common/schemas/dtos/transactions';
import {
  ProfileSchema,
  TransactionStatusSchema,
  UserSchema,
} from '@/common/schemas/generated';
import { prisma } from '@/db';
import contractController from '@/lib/controllers/contract';
import documentsController from '@/lib/controllers/documents';
import ratesController from '@/lib/controllers/feeds/rates';
import salesController from '@/lib/controllers/sales';
import transactionsController from '@/lib/controllers/transactions';
import usersController from '@/lib/controllers/users';
import { invariant } from '@epic-web/invariant';
import { redirect } from 'next/navigation';
import { defineChain, getContract as getContractThirdweb } from 'thirdweb';
import { bscTestnet } from 'thirdweb/chains';
import { erc20Abi } from 'viem';
import { z } from 'zod';
import { authCache } from '../auth/cache';
import {
  generateAuthPayload,
  generateJWT,
  serverClient,
  verifyAuthPayload,
  verifyJwt,
} from '../auth/thirdweb';
import { authActionClient, loginActionClient } from './config';
import {
  FIAT_CURRENCIES,
  JWT_EXPIRATION_TIME,
} from '@/common/config/constants';
import {
  deleteSessionCookie,
  getSessionCookie,
  setSessionCookie,
} from '../auth/cookies';
import { env } from '@/common/config/env';
import { InvestFormSchema } from '@/app/(dash)/dashboard/buy/invest/schemas';
import { FOP, Prisma } from '@prisma/client';

export const hasActiveSession = async (address: string, token: string) => {
  const sessions = await prisma.session.findMany({
    where: {
      expiresAt: {
        gt: new Date(),
      },
      token,
      user: {
        walletAddress: address,
      },
    },
    select: {
      id: true,
      expiresAt: true,
    },
  });

  // If there is at least one active session
  return sessions.length > 0;
};

export const isLoggedIn = loginActionClient
  .schema(z.string())
  .action(async ({ parsedInput }) => {
    const data = await getSessionCookie();
    if (!data) return false;
    const hasSession = await hasActiveSession(parsedInput, data);
    return hasSession;
  });

const LoginParams = z.object({
  signature: z.string(),
  payload: z.object({
    address: z.string(),
    chain_id: z.string().optional(),
    domain: z.string(),
    expiration_time: z.string(),
    invalid_before: z.string(),
    issued_at: z.string(),
    nonce: z.string(),
    statement: z.string(),
    version: z.string(),
    uri: z.string().optional(),
    resources: z.array(z.string()).optional(),
    temp: z.string().optional(),
  }),
});

export type LoginParams = z.infer<typeof LoginParams>;

export const login = loginActionClient
  .schema(LoginParams)
  .action(async ({ parsedInput }) => {
    const verifiedPayload = await verifyAuthPayload(parsedInput);
    if (!verifiedPayload.valid) {
      redirect('/?error=invalid_payload');
    }
    const { payload } = verifiedPayload;

    console.log('VERIFIED PAYLOAD');
    // Here should go the JWT logic
    const [jwt] = await Promise.all([
      generateJWT(payload, {
        address: payload.address,
        ...(payload.chain_id && { chainId: payload.chain_id }),
      }),
    ]);
    await setSessionCookie(jwt);
    const user = await usersController.createUser({
      address: payload.address,
      session: {
        jwt,
        expirationTime: JWT_EXPIRATION_TIME,
      },
      chainId: payload.chain_id ? Number(payload.chain_id) : undefined,
    });
    invariant(user?.success, 'User could not be found/created');

    redirect(user.data.user.emailVerified ? '/dashboard' : '/onboarding');
  });

export const generatePayload = loginActionClient
  .schema(
    z.object({
      address: z.string(),
      chainId: z.coerce.number(),
    })
  )
  .action(async ({ parsedInput: { chainId, address } }) => {
    return await generateAuthPayload({ chainId, address });
  });

export const logout = loginActionClient.action(async () => {
  const data = String((await getSessionCookie()) || '');

  await deleteSessionCookie();
  if (data) {
    const verified = await verifyJwt(data);
    void Promise.allSettled([
      verified.valid && authCache.delete(verified.parsedJWT.sub),
      prisma.session
        .delete({
          where: {
            token: data,
          },
        })
        .catch((e) => {
          console.error(
            'index.ts:122 ~ e:',
            e instanceof Error ? e.message : e
          );
        }),
    ]);
  }
  redirect('/');
});

export const getCurrentUser = authActionClient.action(
  async ({ ctx: { address } }) => {
    // const user = await getUser({
    //   client,
    //   email: address,
    //   // walletAddress: address,
    // });

    const user = await usersController.getMe({ address });
    if (!user.success) {
      throw new Error(user.message);
    }
    return user.data;
  }
);

export const getCurrentUserEmail = authActionClient.action(
  async ({ ctx: { address } }) => {
    const user = await prisma.user.findUnique({
      where: {
        walletAddress: address,
      },
      select: {
        email: true,
      },
    });
    invariant(user, 'User not found');
    return user.email;
  }
);

export const getSales = authActionClient
  .schema(GetSalesDto.optional())
  .action(async ({ ctx, parsedInput }) => {
    const sales = await salesController.getSales(parsedInput, ctx);
    if (!sales.success) {
      throw new Error(sales.message);
    }
    return sales.data;
  });

export const getSale = authActionClient
  .schema(GetSaleDto)
  .action(async ({ ctx, parsedInput }) => {
    const sales = await salesController.getSale(parsedInput, ctx);
    if (!sales.success) {
      throw new Error(sales.message);
    }
    return sales.data;
  });

export const getActiveSale = authActionClient.action(async ({ ctx }) => {
  const sales = await salesController.getSales({ active: true }, ctx);
  if (!sales.success) {
    throw new Error(sales.message);
  }
  return sales.data?.sales[0];
});

export const getWeb3Contract = authActionClient
  .schema(z.string())
  .action(async ({ parsedInput }) => {
    const contract = await getContractThirdweb({
      // the client you have created via `createThirdwebClient()`
      client: serverClient,
      // the chain the contract is deployed on
      chain: defineChain(bscTestnet.id),
      // the contract's address
      address: parsedInput,
      // OPTIONAL: the contract's abi
      // abi: [...],
      abi: erc20Abi,
    });
    invariant(contract, 'Contract not found');

    return;
  });

export const updateUserInfo = authActionClient
  .schema(
    z.object({
      user: UserSchema.omit({ id: true }).partial(),
      profile: ProfileSchema.omit({ userId: true, id: true })
        .partial()
        .optional(),
    })
  )
  .action(async ({ ctx, parsedInput }) => {
    const sales = await usersController.updateUser(parsedInput, ctx);
    if (!sales.success) {
      throw new Error(sales.message);
    }
    return sales.data;
  });

export const getPendingTransactionsForSale = authActionClient
  .schema(
    z.object({
      saleId: z.string(),
    })
  )
  .action(async ({ ctx, parsedInput }) => {
    const sales = await transactionsController.userTransactionsForSale(
      {
        saleId: parsedInput.saleId,
        status: [
          TransactionStatusSchema.enum.PENDING,
          TransactionStatusSchema.enum.AWAITING_PAYMENT,
        ],
      },
      ctx
    );
    if (!sales.success) {
      throw new Error(sales.message);
    }
    return sales.data;
  });

export const getUserSaleTransactions = authActionClient
  .schema(
    z.object({
      saleId: z.string(),
      status: TransactionStatusSchema.optional(),
    })
  )
  .action(async ({ ctx, parsedInput }) => {
    const transactions = await transactionsController.userTransactionsForSale(
      parsedInput,
      ctx
    );
    if (!transactions.success) {
      throw new Error(transactions.message);
    }
    return transactions.data;
  });

export const getUserTransactions = authActionClient
  .schema(GetTransactionDto)
  .action(async ({ ctx, parsedInput }) => {
    const transactions = await transactionsController.getUserTransactions(
      parsedInput,
      ctx
    );
    if (!transactions.success) {
      throw new Error(transactions.message);
    }
    return transactions.data;
  });

export const createTransaction = authActionClient
  .schema(InvestFormSchema)
  .action(async ({ ctx, parsedInput }) => {
    const transactions = await transactionsController.createTransaction(
      {
        tokenSymbol: parsedInput.tokenSymbol,
        quantity: new Prisma.Decimal(parsedInput.paid.quantity),
        formOfPayment: FIAT_CURRENCIES.includes(parsedInput.paid.currency)
          ? FOP.TRANSFER
          : FOP.CRYPTO,
        receivingWallet: parsedInput.receivingWallet,
        saleId: parsedInput.saleId,
        amountPaid: parsedInput.paid.amount,
        paidCurrency: parsedInput.paid.currency,
        comment: null,
      },
      ctx
    );
    if (!transactions.success) {
      throw new Error(transactions.message);
    }
    return transactions.data;
  });

export const confirmTransaction = authActionClient
  .schema(
    UpdateTransactionDto.extend({
      id: z.string(),
    })
  )
  .action(async ({ ctx, parsedInput }) => {
    const transaction = await transactionsController.updateTransactionById(
      parsedInput,
      ctx
    );
    if (!transaction.success) {
      throw new Error(transaction.message);
    }
    return transaction.data;
  });

export const getExchangeRate = authActionClient
  .schema(
    z.object({
      from: z.string().min(3, 'From currency must be at least 3 characters'),
      to: z.string().min(3, 'To currency must be at least 3 characters'),
    })
  )
  .action(async ({ parsedInput }) => {
    const { from, to } = parsedInput;
    const exchangeRate = await ratesController.getExchangeRate(from, to);
    if (!exchangeRate?.success) {
      throw new Error('Failed to fetch exchange rate');
    }
    return exchangeRate;
  });

export const createEmailVerification = authActionClient
  .schema(
    UserSchema.pick({
      email: true,
    }).extend({
      firstName: z
        .string()
        .max(64, 'First name must be less than 64 characters')
        .optional(),
      lastName: z
        .string()
        .max(64, 'Last name must be less than 64 characters')
        .optional(),
    })
  )
  .action(async ({ ctx, parsedInput }) => {
    const { email, ...profile } = parsedInput;
    const result = await usersController.updateUser(
      { user: { email }, profile },
      ctx
    );

    if (!result.success) {
      throw new Error(result.message);
    }
    return result;
  });

export const verifyEmail = authActionClient
  .schema(z.object({ token: z.string() }))
  .action(async ({ ctx, parsedInput }) => {
    const result = await usersController.verifyEmail(parsedInput.token, ctx);
    if (!result.success) {
      throw new Error(result.message);
    }
    return result;
  });

export const updateContractStatus = authActionClient
  .schema(CreateContractStatusDto)
  .action(async ({ ctx, parsedInput }) => {
    const result = await contractController.createContractStatus(
      parsedInput,
      ctx
    );
    if (!result.success) {
      throw new Error(result.message);
    }
    return result;
  });

export const deleteContractStatus = authActionClient
  .schema(z.object({ userId: z.string() }))
  .action(async ({ ctx, parsedInput }) => {
    const result = await contractController.deleteContractStatus(
      parsedInput,
      ctx
    );
    if (!result.success) {
      throw new Error(result.message);
    }
    return result;
  });

export const confirmContractSignature = authActionClient
  .schema(z.void())
  .action(async ({ ctx, parsedInput }) => {
    const result = await contractController.confirmSignature(parsedInput, ctx);
    if (!result.success) {
      throw new Error(result.message);
    }
    return result;
  });

export const getContract = authActionClient.action(async ({ ctx }) => {
  const result = await contractController.getContract(null, ctx);
  if (!result.success) {
    throw new Error(result.message);
  }
  return result;
});

export const getInputOptions = authActionClient.action(async ({ ctx }) => {
  const result = await salesController.getInputOptions(ctx);
  if (!result.success) {
    throw new Error(result.message);
  }
  return result;
});

export const getFileUploadPresignedUrl = authActionClient
  .schema(
    z.object({
      key: z.string().min(1),
    })
  )
  .action(async ({ ctx, parsedInput }) => {
    const result = await documentsController.getPresignedUrl(parsedInput.key);
    if (!result.success) {
      throw new Error(result.message);
    }
    return result.data;
  });

export const validateMagicWord = authActionClient
  .schema(z.object({ invitationCode: z.string() }))
  .action(async ({ ctx, parsedInput }) => {
    if (!env.MAGIC_WORD) {
      // IF not set, then allow access
      return true;
    }
    if (parsedInput.invitationCode !== env.MAGIC_WORD) {
      throw new Error('Invalid magic word');
    }
    return true;
  });

/**
 * =====================================
 * =============== MUTATION ACTIONS ===============
 * =====================================
 */
