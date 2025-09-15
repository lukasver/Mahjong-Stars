import { faker } from "@faker-js/faker";
import { Prisma } from "@prisma/client";
// import { BigNumber } from 'ethers';
import nock from "nock";
import sinon from "sinon";
import { afterEach, describe, expect, it } from "vitest";
import { CRYPTO_CURRENCIES, FIAT_CURRENCIES } from "@/common/config/constants";
import { AmountCalculatorService } from "@/lib/services/pricefeeds/amount.service";
import { mockExchangeRates } from "./mocks/helpers";

async function getExchangeRate() {
	return { data: mockExchangeRates, error: null };
}

/**
 * Test suite for AmountCalculatorService
 */
describe("Amount Calculator service", () => {
	const domain = process.env.NEXT_PUBLIC_DOMAIN!;
	nock.disableNetConnect();
	nock.enableNetConnect(domain);
	const service = new AmountCalculatorService(getExchangeRate);
	const sandbox = sinon.createSandbox();
	afterEach(() => {
		sandbox.restore();
	});

	describe("[getPrecision]", () => {
		it("Return precision for FIAT currencies", () => {
			const spy = sandbox.spy(service, "getPrecision");
			let callCount = 0;
			for (const currency of FIAT_CURRENCIES) {
				callCount++;
				const value = service.getPrecision(currency);
				expect(value).toBeTruthy();
				expect(value, `Error with: ${currency}`).toBe(service.FIAT_PRECISION);
				expect(spy.calledWith(currency)).toBe(true);
				expect(spy.callCount).toBe(callCount);
			}
		});
		it("Return precision for CRYPTO currencies", () => {
			let callCount = 0;
			const spy = sandbox.spy(service, "getPrecision");
			for (const currency of CRYPTO_CURRENCIES) {
				callCount++;
				const value = service.getPrecision(currency);
				expect(value).toBeTruthy();
				expect(value, `Error with: ${currency}`).toBe(service.CRYPTO_PRECISION);
				expect(spy.calledWith(currency)).toBe(true);
				expect(spy.callCount).toBe(callCount);
			}
		});
	});

	describe("[getPricePerUnit] ", () => {
		it("Should calculate price per unit with correct precision", () => {
			const spy = sandbox.spy(service, "getPricePerUnit");
			const exchangeRate = 0.2;
			const base = 0.1;
			const precision = 4;

			const result = service.getPricePerUnit({
				exchangeRate,
				precision,
				base: base.toString(),
			});

			expect(
				spy.calledWithExactly({
					exchangeRate,
					precision,
					base: base.toString(),
				}),
			).toBe(true);
			expect(result).toBeTruthy();
			expect(new Prisma.Decimal(result).toNumber()).not.toBe(0.2 * 0.1);
			expect(result.toString()).toBe("0.0200");
		});
		it("Should calculate price per unit with correct precision for several known and random cases", () => {
			const spy = sandbox.spy(service, "getPricePerUnit");
			const iterable = Object.values(mockExchangeRates)
				.reduce(
					(agg, el) => agg.concat(Object.values(el)).filter((e) => e !== 1),
					[] as number[],
				)
				.concat(1);
			let calledCount = 0;
			for (const exchangeRate of iterable) {
				calledCount++;
				const mockBase = faker.number.float({
					min: 0.01,
					max: 100,
					fractionDigits: 2,
				});
				const mockPrecision = faker.helpers.arrayElement([
					service.FIAT_PRECISION,
					service.CRYPTO_PRECISION,
				]);

				const result = service.getPricePerUnit({
					exchangeRate,
					precision: mockPrecision,
					base: mockBase.toString(),
				});

				expect(
					spy.calledWithExactly({
						exchangeRate,
						precision: mockPrecision,
						base: mockBase.toString(),
					}),
				).toBe(true);
				expect(spy.callCount).toBe(calledCount);
				const strResult = result;

				expect(result).toBeTruthy();
				expect(strResult.split(".")[1]?.length, `Error with:${strResult}`).toBe(
					mockPrecision === service.FIAT_PRECISION
						? service.FIAT_PRECISION
						: service.CRYPTO_PRECISION,
				);
			}
			const cases = Array.from(Array(100), () => ({
				exchangeRate: faker.number.float({
					min: 0.00000001,
					max: 999.99,
					fractionDigits: faker.helpers.arrayElement([1, 2, 3, 4, 5, 6, 7, 8]),
				}),
				precision: faker.helpers.arrayElement([
					service.FIAT_PRECISION,
					service.CRYPTO_PRECISION,
				]),
				base: faker.number.float({ min: 0.01, max: 100, fractionDigits: 2 }),
			}));
			for (const payload of cases) {
				const result = service.getPricePerUnit({
					exchangeRate: payload.exchangeRate,
					precision: payload.precision,
					base: payload.base.toString(),
				});

				expect(result).toBeTruthy();
				expect(result.toString().split(".")[1]?.length).toBe(
					payload.precision === service.FIAT_PRECISION
						? service.FIAT_PRECISION
						: service.CRYPTO_PRECISION,
				);
			}
		});
	});

	describe("[getTotalAmount]", () => {
		it("Should calculate total amount to pay with correct precision", () => {
			const spy = sandbox.spy(service, "getTotalAmount");
			const cases = Array.from(Array(100), () => {
				const precision = faker.helpers.arrayElement([
					service.FIAT_PRECISION,
					service.CRYPTO_PRECISION,
				]);
				const ppu = new Prisma.Decimal(
					service.getPricePerUnit({
						exchangeRate: faker.number.float({
							min: 0.00000001,
							max: 999.99,
							fractionDigits: faker.helpers.arrayElement([
								1, 2, 3, 4, 5, 6, 7, 8,
							]),
						}),
						precision,
						base: faker.number
							.float({ min: 0.01, max: 100, fractionDigits: 2 })
							.toString(),
					}),
				);
				return {
					pricePerUnit: ppu,
					addFee: faker.datatype.boolean(),
					precision,
					quantity: faker.number.int({ min: 5, max: 99999 }).toString(),
				};
			});
			for (const payload of cases) {
				const result = service.getTotalAmount(payload);
				expect(spy.calledWithExactly(payload)).toBe(true);
				expect(result).toBeTruthy();
				expect(result.toString().split(".")[1]?.length).toBe(
					payload.precision === service.FIAT_PRECISION
						? service.FIAT_PRECISION
						: service.CRYPTO_PRECISION,
				);
				if (!payload.addFee) {
					expect(result.toString()).toBe(
						new Prisma.Decimal(payload.pricePerUnit)
							.mul(payload.quantity)
							.toFixed(payload.precision),
					);
				} else {
					const controlValue = new Prisma.Decimal(payload.pricePerUnit).mul(
						payload.quantity,
					);
					const fee = controlValue.mul(service.BASIS_POINTS);
					expect(result.toString()).toBe(
						controlValue.add(fee).toFixed(payload.precision),
					);
				}
			}
		});
	});

	describe("[getTotalAmountCrypto]", () => {
		it("Should calculate total amount to pay in formatted in crypto as BigNumber", () => {
			const spy = sandbox.spy(service, "getTotalAmountCrypto");
			const cases = Array.from(Array(100), () => {
				const precision = faker.helpers.arrayElement([
					service.FIAT_PRECISION,
					service.CRYPTO_PRECISION,
				]);
				const ppu = service.getPricePerUnit({
					exchangeRate: faker.number.float({
						min: 0.00000001,
						max: 999.99,
						fractionDigits: faker.helpers.arrayElement([
							1, 2, 3, 4, 5, 6, 7, 8,
						]),
					}),
					precision,
					base: faker.number
						.float({ min: 0.01, max: 100, fractionDigits: 2 })
						.toString(),
				});
				return {
					pricePerUnit: ppu,
					addFee: faker.datatype.boolean(),
					precision,
					quantity: faker.number.int({ min: 5, max: 99999 }).toString(),
				};
			});
			for (const payload of cases) {
				const result = service.getTotalAmount(payload);
				const cryptoTokenDecimals = faker.helpers.arrayElement([6, 18]);
				const resultCrypto = service.getTotalAmountCrypto({
					amount: result.toString(),
					decimals: cryptoTokenDecimals,
				});
				expect(
					spy.calledWithExactly({
						amount: result.toString(),
						decimals: cryptoTokenDecimals,
					}),
				).toBe(true);
				expect(resultCrypto).toBeTruthy();
				// expect(resultCrypto).toBeInstanceOf(BigNumber);
			}
		});
	});

	describe("Management fees calculation", () => {
		it("Should work in random cases", () => {
			const payloads = Array.from(Array(1000), () => {
				const precision = faker.helpers.arrayElement([
					service.FIAT_PRECISION,
					service.CRYPTO_PRECISION,
				]);
				return {
					pricePerUnit: String(
						faker.number.float({
							min: 1.01,
							max: 99.99,
							fractionDigits: precision,
						}),
					),
					quantity: String(faker.number.int({ min: 1, max: 99999 })),
					addFee: faker.datatype.boolean(),
					precision,
				};
			});

			let _index = 1;
			for (const payload of payloads) {
				const amount = service.getTotalAmount(payload);
				const control = new Prisma.Decimal(payload.pricePerUnit).mul(
					payload.quantity,
				);
				if (payload.addFee) {
					const { amount } = service.getTotalAmount({
						...payload,
						addFee: false,
					});
					const amountWithoutFee = new Prisma.Decimal(amount);
					const fee = amountWithoutFee.mul(service.BASIS_POINTS);
					expect(amountWithoutFee.lessThanOrEqualTo(amount)).toBe(true);
					expect(
						amountWithoutFee.toString(),
						`Error: \n            Fee: ${fee}\n            amount: ${amount}\n            amountWithoutFee: ${amountWithoutFee}\n            `,
					).not.toBe(amount);
					// If we are adding fee, the amount should be equal to the control (ppu * quantity) plus fee
					expect(amount).toBe(control.add(fee).toFixed(payload.precision));
				} else {
					// If we are not adding fee, the amount should be equal to the control (ppu * quantity)
					expect(amount).toBe(control.toFixed(payload.precision));
				}
				_index++;
			}
		});
	});
});
