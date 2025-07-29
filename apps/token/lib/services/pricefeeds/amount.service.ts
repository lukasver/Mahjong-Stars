import { Prisma } from '@prisma/client';
import { BigNumberish, parseUnits } from 'ethers';
import { FIAT_CURRENCIES } from '@/common/config/constants';
import { Sale } from '@/common/schemas/generated';
import { GetExchangeRate } from '@/common/schemas/dtos/rates';

const Decimal = Prisma.Decimal;

type AmountParameters = {
  initialCurrency: string;
  currency: string;
  base: string;
  quantity: number;
  addFee?: boolean;
  precision?: number;
};

type getAmountAndPricePerUnitReturn = {
  amount: string;
  pricePerUnit: string;
  exchangeRate: number;
  currency: string;
};

type GetRateFetcher = (
  from: string,
  to: string
) => Promise<
  | {
      data: GetExchangeRate;
      error: null;
    }
  | {
      data: null;
      error: unknown;
    }
>;

export class AmountCalculatorService {
  public FIAT_PRECISION: number = 4;
  public CRYPTO_PRECISION: number = 8;
  public BASIS_POINTS: number = new Decimal(2).div(10000).toNumber();
  private getRateFetcher: GetRateFetcher;

  constructor(fetcher: GetRateFetcher) {
    this.getRateFetcher = fetcher;
  }

  getPrecision(currency: string, precision?: number) {
    if (precision) return precision;
    if (FIAT_CURRENCIES.includes(currency)) {
      return this.FIAT_PRECISION;
    }
    return this.CRYPTO_PRECISION;
  }

  getPricePerUnit({
    exchangeRate,
    precision,
    base,
  }: {
    exchangeRate: number;
    base: string;
    precision: number;
  }) {
    const val = new Decimal(exchangeRate).mul(base);
    return val.toFixed(precision);
  }

  /**
   * Function to get the amount to pay without calling the pricefeeds endpoint
   * The price per unit needs to be known to avoid calling the endpoint.
   */
  getTotalAmount({
    pricePerUnit,
    quantity,
    addFee,
    precision = this.FIAT_PRECISION,
  }: {
    pricePerUnit: Prisma.Decimal | string;
    quantity: string | number;
    addFee?: boolean;
    precision?: number;
  }) {
    let ppu: Prisma.Decimal;
    if (typeof pricePerUnit === 'string') {
      ppu = new Decimal(pricePerUnit);
    } else {
      ppu = pricePerUnit;
    }
    let amount = ppu.mul(new Decimal(quantity));
    if (addFee) {
      const fees = amount.mul(this.BASIS_POINTS);
      amount = amount.add(fees);
    }
    return amount.toFixed(precision);
  }

  /**
   * This is used to get the formatted amount in crypto as BigNumber to feed the useBlockchainTransaction with
   * the current integer value. Essentially this function converts the floating point number into an integer
   * @param amount amount to pay (to be formatted)
   * @param decimals number of decimals of the crypto token. Ex: 6 USDC, 18 ETH (or other ERC20 tokens)
   * @returns BigNumber
   */
  getTotalAmountCrypto({
    amount,
    decimals,
  }: {
    amount: string;
    decimals: number;
  }): BigNumberish {
    // Regular expression to match only the necessary number of decimal places
    const regex = new RegExp(`^(\\d+\\.?\\d{0,${decimals}})`);
    const match = amount.match(regex);

    // TODO! esto es necesario para evitar un underflow en el caso que los decimals del token
    // TODO! sean menores a los decimales recibido tras el cálculo del amount:
    // TODO! Ejemplo: "123.12345678" -> parseUnits("123.12345678, 6") -> daría error
    // TODO! por lo que se re-formatea el amount a la cantidad de decimales del token
    const formattedAmount = match
      ? new Decimal(amount).toFixed(decimals)
      : amount;
    return parseUnits(formattedAmount, decimals);
  }

  async getAmountAndPricePerUnit({
    initialCurrency,
    currency,
    base,
    quantity,
    addFee = false,
    precision,
  }: AmountParameters): Promise<getAmountAndPricePerUnitReturn> {
    const frontPrecision = this.getPrecision(currency, precision);

    const res = await this.getRateFetcher(initialCurrency, currency);
    if (res.error) {
      throw new Error('Error fetching exchange rate');
    }
    const exchangeRate = res.data?.[initialCurrency]?.[currency];
    if (!exchangeRate) {
      throw new Error('Cannot calculate exchange rate');
    }
    const pricePerUnit = this.getPricePerUnit({
      base,
      exchangeRate,
      precision: frontPrecision,
    });
    const amountToPay = this.getTotalAmount({
      pricePerUnit,
      quantity: quantity.toString(),
      addFee,
      precision: frontPrecision,
    });

    return {
      amount: amountToPay.toString(), // Total amount to pay in currency B
      pricePerUnit: pricePerUnit.toString(), // Price per single unit in currency B
      exchangeRate, // Exchange rate of currency B in terms of currency A
      currency, // New currency
    };
  }

  /**
   * Main function to calculate the amount to pay by the user based on the bought token quantity.
   * If PricePerUnit is not passed, then it will be fetched from the pricefeeds endpoint.
   * Is an abstraction to use easily in frontend
   * @param boughtTokenQuantity
   * @param boughtTokenCurrency {Currency}
   * @param tokenDecimals {number} amount of decimals of the token if is crypto payment
   * @param activeSale
   * @returns
   */
  calculateAmountToPay = async (args: {
    quantity: string | number;
    currency: string;
    sale: Pick<Sale, 'currency' | 'tokenPricePerUnit'>;
    pricePerUnit?: string | null;
    tokenDecimals?: number;
  }) => {
    const { quantity, currency, sale, pricePerUnit, tokenDecimals } = args;

    let finalPPU: string | null | undefined = pricePerUnit;
    let amountToPay: string | undefined;

    // If we don't have a rate we need to fetch it
    if (!finalPPU) {
      const { pricePerUnit: newPPU, amount } =
        await this.getAmountAndPricePerUnit({
          initialCurrency: sale?.currency,
          currency: currency,
          base: sale.tokenPricePerUnit?.toString(),
          quantity: Number(quantity) || 1,
          addFee: sale?.currency !== currency,
          precision: tokenDecimals,
        });

      finalPPU = newPPU;
      amountToPay = amount;
      // Otherwise, we receive the rate from parameters
    } else {
      amountToPay = this.getTotalAmount({
        pricePerUnit: finalPPU,
        quantity: quantity || '0',
        addFee: sale?.currency !== currency,
        precision: tokenDecimals,
      });
    }

    if (tokenDecimals) {
      const bigNumber = this.getTotalAmountCrypto({
        amount: amountToPay!,
        decimals: tokenDecimals,
      });
      return {
        pricePerUnit: finalPPU,
        amount: amountToPay,
        currency,
        decimals: tokenDecimals,
        bigNumber: bigNumber,
      };
    } else {
      return {
        pricePerUnit: finalPPU,
        amount: amountToPay,
        currency,
      };
    }
  };
}
