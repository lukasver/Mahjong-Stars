import { faker } from "@faker-js/faker";
import { Prisma } from "@prisma/client";
import Decimal from "decimal.js";
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

      const FIAT_PRECISION = 8;
      for (const currency of FIAT_CURRENCIES) {
        callCount++;
        const value = service.getPrecision(currency);
        expect(value).toBeTruthy();
        expect(value, `Error with: ${currency}`).toBe(FIAT_PRECISION);
        expect(spy.calledWith(currency)).toBe(true);
        expect(spy.callCount).toBe(callCount);
      }
    });
    it("Return precision for CRYPTO currencies", () => {
      let callCount = 0;
      const spy = sandbox.spy(service, "getPrecision");
      const CRYPTO_PRECISION = 18;
      for (const currency of CRYPTO_CURRENCIES) {
        callCount++;


        const value = service.getPrecision(currency);
        expect(value).toBeTruthy();
        expect(value, `Error with: ${currency}`).toBe(CRYPTO_PRECISION);
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
          // @ts-ignore fixme
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
          service.getPrecision('USD'), //FIAT precision (8)
          service.getPrecision('ETH'), //CRYPTO precision (18)
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
          mockPrecision
        );
      }
      const cases = Array.from(Array(100), () => ({
        exchangeRate: faker.number.float({
          min: 0.00000001,
          max: 999.99,
          fractionDigits: faker.helpers.arrayElement([1, 2, 3, 4, 5, 6, 7, 8]),
        }),
        precision: faker.helpers.arrayElement([
          service.getPrecision('USD'), //FIAT precision (8)
          service.getPrecision('ETH'), //CRYPTO precision (18)
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
          payload.precision
        );
      }
    });
  });

  describe("[getTotalAmount]", () => {
    it("Should calculate total amount to pay with correct precision", () => {
      const spy = sandbox.spy(service, "getTotalAmount");
      const cases = Array.from(Array(100), () => {
        const precision = faker.helpers.arrayElement([
          service.getPrecision('USD'), //FIAT precision (8)
          service.getPrecision('ETH'), //CRYPTO precision (18)
        ]);
        const ppu = new Decimal(
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
        expect(result.amount).toBeTruthy();
        expect(result.amount.split(".")[1]?.length).toBe(
          payload.precision
        );
        if (!payload.addFee) {
          expect(result.amount.toString()).toBe(
            new Decimal(payload.pricePerUnit)
              .mul(payload.quantity)
              .toFixed(payload.precision),
          );
        } else {
          const controlValue = new Decimal(payload.pricePerUnit).mul(
            payload.quantity,
          );
          const fee = controlValue
            .mul(service.getBasisPoints())
            .toFixed(payload.precision);
          expect(result.fees).toBeTruthy();

          expect(result.fees.toString()).toBe(fee);
        }
      }
    });
  });

  describe("[getTotalAmountCrypto]", () => {
    it("Should calculate total amount to pay in formatted in crypto as BigNumber", () => {
      const spy = sandbox.spy(service, "getTotalAmountCrypto");
      const cases = Array.from(Array(100), () => {
        const precision = faker.helpers.arrayElement([
          service.getPrecision('USD'), //FIAT precision (8)
          service.getPrecision('ETH'), //CRYPTO precision (18)
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
        const { fees, amount } = service.getTotalAmount(payload);
        const cryptoTokenDecimals = faker.helpers.arrayElement([6, 18]);
        const { bigNumber: resultCrypto, decimals: _ } = service.getTotalAmountCrypto({
          amount: amount.toString(),
          decimals: cryptoTokenDecimals,
        });
        expect(
          spy.calledWithExactly({
            amount: amount.toString(),
            decimals: cryptoTokenDecimals,
          }),
        ).toBe(true);
        expect(resultCrypto).toBeTruthy();
        // expect(resultCrypto).toBeInstanceOf(BigNumber);
      }
    });
  });

  describe("[convertToCurrency]", () => {
    it("Should convert currency correctly with known exchange rates", async () => {
      const spy = sandbox.spy(service, "convertToCurrency");

      // Test USD to EUR conversion
      // From mockExchangeRates: USD to EUR = 0.9252
      const result1 = await service.convertToCurrency({
        amount: "100",
        fromCurrency: "USD",
        toCurrency: "EUR",
      });

      expect(
        spy.calledWithExactly({
          amount: "100",
          fromCurrency: "USD",
          toCurrency: "EUR",
        }),
      ).toBe(true);
      expect(result1).toBeTruthy();
      expect(Object.keys(result1)).toEqual(["amount", "currency", "exchangeRate"]);
      expect(result1.currency).toBe("EUR");
      expect(result1.exchangeRate).toBe(0.9252);
      // 100 * 0.9252 = 92.52
      expect(result1.amount).toBe(new Decimal("100").mul(0.9252).toFixed(service.getPrecision('EUR')));

      // Test EUR to USD conversion
      // From mockExchangeRates: EUR to USD = 1.081
      const result2 = await service.convertToCurrency({
        amount: "100",
        fromCurrency: "EUR",
        toCurrency: "USD",
      });

      expect(Object.keys(result2)).toEqual(["amount", "currency", "exchangeRate"]);
      expect(result2.currency).toBe("USD");
      expect(result2.exchangeRate).toBe(1.081);
      // 100 * 1.081 = 108.1
      expect(result2.amount).toBe(new Decimal("100").mul(1.081).toFixed(service.getPrecision('USD')));

      // Test USD to CHF conversion
      // From mockExchangeRates: USD to CHF = 0.8824
      const result3 = await service.convertToCurrency({
        amount: "50",
        fromCurrency: "USD",
        toCurrency: "CHF",
      });

      expect(Object.keys(result3)).toEqual(["amount", "currency", "exchangeRate"]);
      expect(result3.currency).toBe("CHF");
      expect(result3.exchangeRate).toBe(0.8824);
      // 50 * 0.8824 = 44.12
      expect(result3.amount).toBe(new Decimal("50").mul(0.8824).toFixed(service.getPrecision('CHF')));
    });

    it("Should convert currency with correct mathematical precision", async () => {
      const spy = sandbox.spy(service, "convertToCurrency");

      // Test with various amounts and verify mathematical correctness
      const testCases = [
        {
          amount: "1",
          fromCurrency: "USD",
          toCurrency: "EUR",
          expectedRate: 0.9252,
        },
        {
          amount: "10",
          fromCurrency: "EUR",
          toCurrency: "USD",
          expectedRate: 1.081,
        },
        {
          amount: "1000",
          fromCurrency: "USD",
          toCurrency: "CHF",
          expectedRate: 0.8824,
        },
        {
          amount: "0.5",
          fromCurrency: "EUR",
          toCurrency: "CHF",
          expectedRate: 0.9543,
        },
        {
          amount: "250.75",
          fromCurrency: "USD",
          toCurrency: "EUR",
          expectedRate: 0.9252,
        },
      ];

      for (const testCase of testCases) {
        const result = await service.convertToCurrency({
          amount: testCase.amount,
          fromCurrency: testCase.fromCurrency,
          toCurrency: testCase.toCurrency,
        });

        expect(
          spy.calledWith({
            amount: testCase.amount,
            fromCurrency: testCase.fromCurrency,
            toCurrency: testCase.toCurrency,
          }),
        ).toBe(true);

        expect(Object.keys(result)).toEqual(["amount", "currency", "exchangeRate"]);
        expect(result.currency).toBe(testCase.toCurrency);
        expect(result.exchangeRate).toBe(testCase.expectedRate);

        // Verify mathematical correctness: amount * exchangeRate = result
        const expectedAmount = new Decimal(testCase.amount)
          .mul(testCase.expectedRate)
          .toFixed(service.getPrecision(testCase.toCurrency));
        expect(result.amount).toBe(expectedAmount);
      }
    });

    it("Should use correct precision for FIAT and CRYPTO currencies", async () => {
      // Test FIAT currency precision (4 decimal places)
      const fiatResult = await service.convertToCurrency({
        amount: "100",
        fromCurrency: "USD",
        toCurrency: "EUR",
      });

      expect(Object.keys(fiatResult)).toEqual(["amount", "currency", "exchangeRate"]);
      expect(fiatResult.amount.split(".")[1]?.length).toBe(
        service.getPrecision('USD'), //FIAT precision (8)
      );

      // Test CRYPTO currency precision (8 decimal places)
      const cryptoResult = await service.convertToCurrency({
        amount: "100",
        fromCurrency: "USD",
        toCurrency: "ETH",
      });

      expect(Object.keys(cryptoResult)).toEqual(["amount", "currency", "exchangeRate"]);
      expect(cryptoResult.amount.split(".")[1]?.length).toBe(
        service.getPrecision('ETH'), //CRYPTO precision (18)
      );

      // Test with custom precision
      const customPrecision = 6;
      const customResult = await service.convertToCurrency({
        amount: "100",
        fromCurrency: "USD",
        toCurrency: "EUR",
        precision: customPrecision,
      });

      expect(Object.keys(customResult)).toEqual(["amount", "currency", "exchangeRate"]);
      expect(customResult.amount.split(".")[1]?.length).toBe(customPrecision);
    });

    it("Should convert currency correctly with random test cases", async () => {
      const spy = sandbox.spy(service, "convertToCurrency");

      // Get all available currency pairs from mockExchangeRates
      const currencyPairs: Array<{
        fromCurrency: string;
        toCurrency: string;
        exchangeRate: number;
      }> = [];

      Object.entries(mockExchangeRates).forEach(([from, rates]) => {
        Object.entries(rates).forEach(([to, rate]) => {
          if (from !== to) {
            currencyPairs.push({
              fromCurrency: from,
              toCurrency: to,
              exchangeRate: rate as number,
            });
          }
        });
      });

      // Test with 100 random cases
      const testCases = Array.from(Array(100), () => {
        const pair = faker.helpers.arrayElement(currencyPairs);
        const amount = faker.number.float({
          min: 0.01,
          max: 100000,
          fractionDigits: faker.helpers.arrayElement([0, 2, 4, 8]),
        });

        return {
          amount: amount.toString(),
          fromCurrency: pair.fromCurrency,
          toCurrency: pair.toCurrency,
          expectedRate: pair.exchangeRate,
        };
      });

      for (const testCase of testCases) {
        const result = await service.convertToCurrency({
          amount: testCase.amount,
          fromCurrency: testCase.fromCurrency,
          toCurrency: testCase.toCurrency,
        });

        expect(
          spy.calledWith({
            amount: testCase.amount,
            fromCurrency: testCase.fromCurrency,
            toCurrency: testCase.toCurrency,
          }),
        ).toBe(true);

        expect(result).toBeTruthy();
        expect(Object.keys(result)).toEqual(["amount", "currency", "exchangeRate"]);
        expect(result.currency).toBe(testCase.toCurrency);
        expect(result.exchangeRate).toBe(testCase.expectedRate);

        // Verify mathematical correctness
        const expectedAmount = new Decimal(testCase.amount)
          .mul(testCase.expectedRate)
          .toFixed(service.getPrecision(testCase.toCurrency));
        expect(result.amount).toBe(expectedAmount);

        // Verify precision
        const expectedPrecision = service.getPrecision(testCase.toCurrency);
        const decimalPart = result.amount.split(".")[1];
        if (decimalPart) {
          expect(decimalPart.length).toBe(expectedPrecision);
        }
      }
    });

    it("Should handle edge cases correctly", async () => {
      // Test with zero amount
      const zeroResult = await service.convertToCurrency({
        amount: "0",
        fromCurrency: "USD",
        toCurrency: "EUR",
      });


      expect(Object.keys(zeroResult)).toEqual(["amount", "currency", "exchangeRate"]);
      const precision = service.getPrecision('EUR');
      expect(zeroResult.amount).toBe(new Decimal("0").toFixed(precision));
      expect(zeroResult.exchangeRate).toBe(0.9252);

      // Test with very small amount
      const smallResult = await service.convertToCurrency({
        amount: "0.0001",
        fromCurrency: "USD",
        toCurrency: "EUR",
      });
      expect(Object.keys(smallResult)).toEqual(["amount", "currency", "exchangeRate"]);
      expect(smallResult.amount).toBeTruthy();
      expect(new Decimal(smallResult.amount).toNumber()).toBeGreaterThan(0);

      // Test with very large amount
      const largeResult = await service.convertToCurrency({
        amount: "999999.99",
        fromCurrency: "USD",
        toCurrency: "EUR",
      });
      expect(Object.keys(largeResult)).toEqual(["amount", "currency", "exchangeRate"]);
      expect(largeResult.amount).toBeTruthy();
      const expectedLarge = new Decimal("999999.99")
        .mul(0.9252)
        .toFixed(precision);
      expect(largeResult.amount).toBe(expectedLarge);

      // Test with number input instead of string
      const numberResult = await service.convertToCurrency({
        amount: 100,
        fromCurrency: "USD",
        toCurrency: "EUR",
      });

      expect(Object.keys(numberResult)).toEqual(["amount", "currency", "exchangeRate"]);
      expect(numberResult.amount).toBe(new Decimal("100").mul(0.9252).toFixed(service.getPrecision('EUR')));
    });

    it("Should throw error when exchange rate cannot be fetched", async () => {
      const errorService = new AmountCalculatorService(async () => ({
        data: null,
        error: new Error("Network error"),
      }));

      await expect(
        errorService.convertToCurrency({
          amount: "100",
          fromCurrency: "USD",
          toCurrency: "EUR",
        }),
      ).rejects.toThrow("Error fetching exchange rate for currency conversion");
    });

    it("Should throw error when exchange rate is missing", async () => {
      const errorService = new AmountCalculatorService(async () => ({
        data: {},
        error: null,
      }));

      await expect(
        errorService.convertToCurrency({
          amount: "100",
          fromCurrency: "USD",
          toCurrency: "EUR",
        }),
      ).rejects.toThrow("Cannot get exchange rate from USD to EUR");
    });
  });

  describe('[calculateAmountToPay]', () => {
    // TODO:
  })

  describe('[getAmountAndPricePerUnit]', () => {
    // TODO:
  })

  describe("Management fees calculation", () => {
    it("Should work in random cases", () => {
      const payloads = Array.from(Array(1000), () => {
        const precision = faker.helpers.arrayElement([
          service.getPrecision('USD'), //FIAT precision (8)
          service.getPrecision('ETH'), //CRYPTO precision (18)
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
        const result = service.getTotalAmount(payload);
        const control = new Prisma.Decimal(payload.pricePerUnit).mul(
          payload.quantity,
        );
        // When addFee is true and we have setted the NEXT_PUBLIC_FEE_BPS, the "amount" includes the fee, is the TOTAL to pay.
        // The differnece is that "fees" key is zero or includes the amount of the fee.
        const BPS = process.env.NEXT_PUBLIC_FEE_BPS || 0;
        const shouldCheckAddFee = payload.addFee && !Number.isNaN(BPS) && BPS > 0;
        if (payload.addFee && shouldCheckAddFee) {
          const { amount: amountWithoutFeeStr } = service.getTotalAmount({
            ...payload,
            addFee: false,
          });
          expect(amountWithoutFeeStr).not.toBe(result.amount);
          const amountWithoutFee = new Prisma.Decimal(amountWithoutFeeStr);
          const fee = amountWithoutFee.mul(service.getBasisPoints());
          const expectedAmountWithFee = control
            .add(fee)
            .toFixed(payload.precision);
          const expectedFee = fee.toFixed(payload.precision);
          // The amount without fee should be less than the amount with fee
          expect(
            amountWithoutFee.lessThan(new Prisma.Decimal(result.amount)),
          ).toBe(true);
          // The amount with fee should equal the control (ppu * quantity) plus fee
          expect(result.amount).toBe(expectedAmountWithFee);
          // The fees should equal the calculated fee
          expect(result.fees).toBe(expectedFee);
        } else {
          // If we are not adding fee, the amount should be equal to the control (ppu * quantity)
          expect(result.amount).toBe(control.toFixed(payload.precision));
          expect(result.fees).toBe(new Decimal(0).toFixed(payload.precision));
        }
        _index++;
      }
    });
  });
});
