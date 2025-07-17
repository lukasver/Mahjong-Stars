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
