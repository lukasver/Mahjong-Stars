import { z } from 'zod';

export const GetUserDto = z.object({
  address: z.string(),
});

export type GetUserDto = z.infer<typeof GetUserDto>;

export const CreateUserDto = z.object({
  address: z.string(),
  promoCode: z.string().optional(),
  dateOfBirth: z.string().optional(),
  session: z
    .object({
      jwt: z.string(),
      expirationTime: z.coerce.number().describe('In seconds'),
    })
    .optional(),
  chainId: z.coerce.number().optional(),
});

export type CreateUserDto = z.infer<typeof CreateUserDto>;
