import { Icons } from "@mjs/ui/components/icons";
import { Button } from "@mjs/ui/primitives/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@mjs/ui/primitives/card";
import { Separator } from "@mjs/ui/primitives/separator";
import { toast } from "@mjs/ui/primitives/sonner";
import { copyToClipboard, formatCurrency } from "@mjs/utils/client";
import { Prisma } from "@prisma/client";

interface BankTransferProps {
  onClose: () => void;
  value: Prisma.Decimal | number | string;
  currency: string;
  onConfirm: () => void;
}

const BankTransfer = ({
  onClose,
  value,
  currency,
  onConfirm,
}: BankTransferProps) => {
  if (!value || Number.isNaN(Number(value))) {
    toast.error(
      "Unexpected error, please refresh page or contact administrator",
    );
    return null;
  }

  const formattedValue = formatCurrency(value, {
    locale: "en-US",
    currency,
  });

  return (
    <Card className="w-full max-w-sm sm:max-w-md mx-auto">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl sm:text-2xl font-semibold text-center">
          Bank Transfer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4">
        <div className="text-center">
          <p className="text-base sm:text-lg font-medium">Smat S.A</p>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Rue de l'Avenir 23 - 2800 Délemont - Switzerland
          </p>
        </div>

        {dataTransfer.map(({ subtitle, iban, bic }, index) => (
          <div key={index} className="space-y-2 sm:space-y-3">
            <h3 className="text-base sm:text-lg font-medium">{subtitle}</h3>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs sm:text-sm break-all">
                  IBAN: {iban}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 sm:h-8 sm:w-8 p-0 flex-shrink-0"
                  onClick={() => copyToClipboard(iban.trim())}
                >
                  <Icons.copy className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs sm:text-sm break-all">BIC: {bic}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 sm:h-8 sm:w-8 p-0 flex-shrink-0"
                  onClick={() => copyToClipboard(bic.trim())}
                >
                  <Icons.copy className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}

        <div className="flex items-center gap-2 pt-3 sm:pt-4">
          <span className="text-base sm:text-lg font-medium text-primary">
            TO PAY:
          </span>
          <span className="text-base sm:text-lg font-medium">
            {formattedValue}
          </span>
        </div>

        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            ( This transaction will be canceled in 6 hours if payment is not
            confirmed )
          </p>
        </div>

        <div className="flex gap-2 sm:gap-4 pt-3 sm:pt-4">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Close
          </Button>
          <Button variant="default" className="flex-1" onClick={onConfirm}>
            Confirm Payment
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const dataTransfer = [
  {
    subtitle: "For CHF",
    iban: " CH71 8080 8002 6358 1785 0 ",
    bic: " RAIFCH22",
  },
  {
    subtitle: "For EUR",
    iban: " GB38REVO00996909546892 ",
    bic: " REVOGB21",
  },
];

export default BankTransfer;
