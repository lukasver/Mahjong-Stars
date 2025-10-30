import "@total-typescript/ts-reset";
import "@total-typescript/ts-reset/dom";

declare global {
	type Awaitable<T> = T | PromiseLike<T>;

	/**
	 * Combines members of an intersection into a readable type.
	 * @see {@link https://twitter.com/mattpocockuk/status/1622730173446557697?s=20&t=NdpAcmEFXY01xkqU3KO0Mg}
	 * @example
	 * Prettify<{ a: string } & { b: string } & { c: number, d: bigint }>
	 * => { a: string, b: string, c: number, d: bigint }
	 */
	type Prettify<T> = {
		[K in keyof T]: T[K];
	} & {};
}

export {};
