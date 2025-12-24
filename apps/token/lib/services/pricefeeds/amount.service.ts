import { invariant } from "@epic-web/invariant";
import { Prisma } from "@prisma/client";
import { BigNumberish, parseUnits } from "ethers";
import { FIAT_CURRENCIES } from "@/common/config/constants";
import { GetExchangeRate } from "@/common/schemas/dtos/rates";
import { Sale } from "@/common/schemas/generated";

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
  fees: string;
  pricePerUnit: string;
  exchangeRate: number | string;
  currency: string;
};

type GetRateFetcher = (
  from: string,
  to: string,
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
  private FIAT_PRECISION: number = 8;
  private CRYPTO_PRECISION: number = 18;
  // 2 BPS or 0.02% or 0.0002 in decimal format
  private BASIS_POINTS: number = !process.env.NEXT_PUBLIC_FEE_BPS
    ? 0
    : new Decimal(process.env.NEXT_PUBLIC_FEE_BPS).div(10000).toNumber();
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

  getBasisPoints() {
    return this.BASIS_POINTS;
  }

  getPricePerUnit({
    exchangeRate,
    precision,
    base,
  }: {
    exchangeRate: number | string;
    base: string;
    precision: number;
  }) {
    const val = new Decimal(exchangeRate).mul(base);
    return val.toFixed(precision);
  }

  /**
   * Function to get the amount to pay without calling the pricefeeds endpoint
   * The price per unit needs to be known to avoid calling the endpoint.
   * If addFee is true, the amount will be calculated with the management fee included.
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
    if (typeof pricePerUnit === "string") {
      ppu = new Decimal(pricePerUnit);
    } else {
      ppu = pricePerUnit;
    }
    let amount = ppu.mul(new Decimal(quantity));
    let fees = new Decimal(0);
    if (addFee) {
      fees = amount.mul(this.BASIS_POINTS);
      amount = amount.add(fees);
    }
    return { amount: amount.toFixed(precision), fees: fees.toFixed(precision) };
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
  }): { bigNumber: BigNumberish; decimals: number } {
    // Regular expression to match only the necessary number of decimal places
    const regex = new RegExp(`^(\\d+\\.?\\d{0,${decimals}})`);
    const match = amount.match(regex);

    //! This is necessary to avoid an underflow in cases where the token's decimals
    //! are less than the number of decimal places present in the calculated amount:
    //! Example: "123.12345678" -> parseUnits("123.12345678", 6) -> would throw an error
    //! So we reformat the amount to match the token's decimal places
    const formattedAmount = match
      ? new Decimal(amount).toFixed(decimals)
      : amount;
    return { bigNumber: parseUnits(formattedAmount, decimals), decimals };
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
      throw new Error("Error fetching exchange rate");
    }
    const exchangeRate = res.data?.[initialCurrency]?.[currency];
    if (!exchangeRate) {
      throw new Error("Cannot calculate exchange rate");
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
      fees: amountToPay.fees || "0",
      amount: amountToPay.amount.toString(), // Total amount to pay in currency B
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
   * @param activeSale
   * @param addFee {boolean} if true, the amount will be calculated with the management fee. By default addFee is true if sale currency is different from payment currency
   * @returns
   */
  calculateAmountToPay = async (args: {
    quantity: string | number;
    currency: string;
    sale: Pick<Sale, "currency" | "tokenPricePerUnit">;
    pricePerUnit?: string | null;
    addFee?: boolean;
  }) => {
    const { quantity, currency, sale, pricePerUnit } = args;

    invariant(quantity, "Quantity is required");
    invariant(currency, "Currency is required");
    invariant(sale, "Sale is required");
    let finalPPU: string | null | undefined = pricePerUnit;
    let amountToPay: { amount: string; fees: string } | undefined;
    const precision = this.getPrecision(currency);

    // If we don't have a rate we need to fetch it
    if (!finalPPU) {
      const {
        pricePerUnit: newPPU,
        amount,
        fees,
      } = await this.getAmountAndPricePerUnit({
        initialCurrency: sale?.currency,
        currency: currency,
        base: sale.tokenPricePerUnit?.toString(),
        quantity: Number(quantity) || 1,
        addFee: args.addFee || sale?.currency !== currency,
        precision,
      });

      finalPPU = newPPU;
      amountToPay = { amount, fees };
      // Otherwise, we receive the rate from parameters
    } else {
      amountToPay = this.getTotalAmount({
        pricePerUnit: finalPPU,
        quantity,
        addFee: args.addFee || sale?.currency !== currency,
        precision,
      });
    }

    return {
      pricePerUnit: finalPPU,
      amount: amountToPay.amount,
      fees: amountToPay.fees,
      currency,
    };
  };

  /**
   * Converts an amount from one currency to another using exchange rates
   * @param amount - The amount to convert
   * @param fromCurrency - The source currency
   * @param toCurrency - The target currency
   * @param precision - Optional precision for the result (defaults to currency-specific precision)
   * @returns Object containing the converted amount, currency, and price per unit
   */
  convertToCurrency = async (args: {
    amount: string | number;
    fromCurrency: string;
    toCurrency: string;
    precision?: number;
  }) => {
    const { amount, fromCurrency, toCurrency, precision } = args;


    // Get exchange rate from source to target currency
    const res = await this.getRateFetcher(fromCurrency, toCurrency);


    if (res.error) {
      throw new Error("Error fetching exchange rate for currency conversion");
    }

    const exchangeRate = res.data?.[fromCurrency]?.[toCurrency];

    if (!exchangeRate) {
      throw new Error(
        `Cannot get exchange rate from ${fromCurrency} to ${toCurrency}`,
      );
    }

    // Calculate the converted amount
    const convertedAmount = new Decimal(amount).mul(exchangeRate);

    // Get appropriate precision for the target currency
    const targetPrecision = this.getPrecision(toCurrency, precision);

    // Format the converted amount
    const formattedAmount = convertedAmount.toFixed(targetPrecision);

    // // Calculate price per unit (1 unit of source currency in target currency)
    // const pricePerUnit = new Decimal(exchangeRate).toFixed(targetPrecision);

    return {
      amount: formattedAmount,
      currency: toCurrency,
      exchangeRate: exchangeRate,
    };
  };

  /**
   * Get the fee to be applied based on the amount and the fee configuration
   */
  calculateFee = (args: {
    fee: {
      fixed?: string | number | Prisma.Decimal;
      percentage?: string | number | Prisma.Decimal;
    };
    amount: string | number | Prisma.Decimal;
  }) => {
    const { amount, fee } = args;
    let feeAmount = new Decimal(0);
    if (fee.fixed) {
      feeAmount = feeAmount.add(new Decimal(fee.fixed));
    }
    if (fee.percentage) {
      feeAmount = feeAmount.add(
        new Decimal(amount).mul(new Decimal(fee.percentage).div(100)),
      );
    }
    return feeAmount;
  };
}
