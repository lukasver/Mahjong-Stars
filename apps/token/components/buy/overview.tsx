import { getGlassyCardClassName } from "@mjs/ui/components/cards";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@mjs/ui/primitives/card";
import { Separator } from "@mjs/ui/primitives/separator";
import { formatCurrency, formatDate } from "@mjs/utils/client";
import { DateTime } from "luxon";
import { useLocale } from "next-intl";
import { SaleWithToken } from "@/common/types/sales";
import { PercentBar } from "@/components/percent-bar";
import { percentCalculator } from "@/utils/percentCalculator";

export const OverviewProject = ({ sale }: { sale: SaleWithToken }) => {
  const {
    initialTokenQuantity,
    currency,
    tokenName,
    tokenSymbol,
    tokenPricePerUnit,
    saleClosingDate,
    saleStartDate,
  } = sale || {};

  const availableTokenQuantity = sale?.availableTokenQuantity || 0;
  const locale = useLocale();
  return (
    <Card className={getGlassyCardClassName("w-full shadow-lg rounded-xl p-6")} data-testid="overview-card">
      <CardHeader className="pb-2 gap-4 p-0 mb-4">
        <CardTitle className="text-secondary">Overview</CardTitle>
        <Separator className="bg-secondary" orientation="horizontal" />
      </CardHeader>
      <CardContent className="flex flex-col gap-4 p-0">
        <Row
          title="Tokens available"
          value={formatCurrency(availableTokenQuantity, { locale })}
        />
        <div className="mt-2">
          <Row
            render={!!initialTokenQuantity}
            title={" "}
            value={`${formatCurrency(sale && percentCalculator(sale), {
              locale,
              precision: 1,
            })}% Sold`}
          />
          <div className="w-full mt-1">
            <PercentBar
              caption={"Total Tokens"}
              value={sale && percentCalculator(sale)}
              textValue={formatCurrency(initialTokenQuantity, {
                locale,
              })}
            />
          </div>
        </div>
        <Separator className="my-4" />
        <Row title="Name" value={tokenName} render={!!tokenName} />
        <Row title="Symbol" value={tokenSymbol} render={!!tokenSymbol} />
        <Row
          title="Total supply"
          value={formatCurrency(initialTokenQuantity, {
            locale,
          })}
          render={!!initialTokenQuantity}
        />
        <Row
          title="Price per token"
          value={formatCurrency(tokenPricePerUnit, {
            currency,
            locale,
            minimumFractionDigits: 3,
            maximumFractionDigits: 6,
          })}
          render={!!tokenPricePerUnit && !!currency}
        />
        <Row
          title="Sale starts"
          value={formatDate(saleStartDate, { format: DateTime.DATE_MED }) || ''}
          render={!!saleStartDate}
        />
        <Row
          title="Sale ends"
          value={formatDate(saleClosingDate, { format: DateTime.DATE_MED }) || ''}
          render={!!saleClosingDate}
        />
      </CardContent>
    </Card>
  );
};

const Row = ({
  value = undefined,
  render = true,
  title,
}: {
  value?: string;
  title: string;
  render?: boolean;
}) =>
  render ? (
    <div className="flex justify-between items-center w-full gap-2">
      <span className="text-sm sm:text-base font-medium text-secondary break-words">
        {title}
      </span>
      {value && (
        <span className="text-xs sm:text-sm text-foreground font-semibold break-words text-right">
          {value}
        </span>
      )}
    </div>
  ) : null;
