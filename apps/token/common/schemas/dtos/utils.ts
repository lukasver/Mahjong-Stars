import { Prisma } from '@prisma/client';

type Awaitable<T> = T | PromiseLike<T>;

export interface Failure<T = unknown> {
  success: false;
  message?: string;
  status: number;
  error: T;
}

export interface Success<T = unknown> {
  success: true;
  status: number;
  message?: string;
  data: T;
}

export const Failure = <T>(
  error: T,
  status?: number,
  message?: string
): Failure<T> => ({
  success: false,
  status: status || 500,
  message:
    message ||
    (error instanceof Error ? error.message : 'Unknown error ocurred'),
  error,
});

export function isObject(obj: unknown): obj is Record<string, unknown> {
  return typeof obj === 'object' && obj !== null;
}

export const Success = async <T>(
  data: Awaitable<T>,
  opts?: { status?: number; message?: string }
): Promise<Success<T>> => {
  const result = await data;
  const formattedData =
    isObject(result) && 'response' in result ? result.response : result;
  return {
    success: true,
    status: opts?.status ?? 200,
    ...(opts?.message && { message: opts.message }),
    data: formattedData as T,
  };
};

/**
 * Recursively converts all Prisma.Decimal instances in an object to strings.
 * Leaves other object types (like Date) untouched.
 * @param value - The input object or value to process.
 * @returns The object with all Prisma.Decimal instances converted to strings.
 */
export function decimalsToString<T>(value: T): T {
  const { Decimal } = Prisma;
  function isPlainObject(val: unknown): val is Record<string, unknown> {
    return isObject(val) && Object.getPrototypeOf(val) === Object.prototype;
  }
  function convert(val: unknown): unknown {
    if (val instanceof Decimal) {
      return val.toString();
    }
    if (Array.isArray(val)) {
      return val.map(convert);
    }
    if (isPlainObject(val)) {
      const obj = val as Record<string, unknown>;
      const result: Record<string, unknown> = {};
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          result[key] = convert(obj[key]);
        }
      }
      return result;
    }
    return val;
  }
  return convert(value) as T;
}
