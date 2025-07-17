import { z } from 'zod';

export const GetExchangeRate = z.record(
  z.string().min(1).max(5),
  z.record(z.string().min(1).max(5), z.number())
);

export type GetExchangeRate = z.infer<typeof GetExchangeRate>;
