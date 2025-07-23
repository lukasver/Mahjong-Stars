import '@total-typescript/ts-reset';
import '@total-typescript/ts-reset/dom';

declare global {
  type Awaitable<T> = T | PromiseLike<T>;
  interface PageProps<T = { [key: string]: string }> {
    params: Promise<T>;
    searchParams: Promise<{ [key: string]: string | string[] }>;
  }
}

export {};
