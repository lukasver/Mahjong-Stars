"use client";

import { CardContainer } from "@mjs/ui/components/cards";
import { cn } from "@mjs/ui/lib/utils";
import { CardHeader, CardTitle } from "@mjs/ui/primitives/card";
import { TransactionStatus } from "@prisma/client";
import { useEffect, useState } from "react";
import { TransactionModalTypes } from "@/common/types";
import { SaleWithToken } from "@/common/types/sales";
import { VerifyMandatoryEmail } from "@/components/buy/verify-mandatory-email";
import { usePendingTransactionsForSale, useUser } from "@/lib/services/api";
import { getQueryClient } from "@/lib/services/query";
import { TimerProgress } from "../timer-progress";
import { InvestForm } from "./form";
import { TokenInvestModals } from "./modals";
import { DiscountBanner } from "./summary";

export function Invest({ sale }: { sale: SaleWithToken }) {
  const [open, setOpen] = useState<TransactionModalTypes | null>(null);
  const { data: user } = useUser();

  const { data } = usePendingTransactionsForSale(sale.id);

  useEffect(() => {
    if (
      data?.transactions.length &&
      data?.transactions.some(
        (t) =>
          (t.status === TransactionStatus.PENDING ||
            t.status === TransactionStatus.AWAITING_PAYMENT) &&
          // A transaction older than a minute to avoid firing the modal right away after a new transaction is created
          new Date(t.createdAt).getTime() < Date.now() - 60000

      ) &&
      !open
    ) {
      setOpen(TransactionModalTypes.PendingTx);
    }
  }, [data]);

  const handleTimerReset = () => {
    const qc = getQueryClient();
    qc.invalidateQueries({ queryKey: ["sales", sale.id, "invest"] });
  };

  return (
    <CardContainer
      header={
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Invest</CardTitle>
          <TimerProgress onReset={() => handleTimerReset()} className='text-secondary-500' />
        </CardHeader>
      }
    >
      <div
        className={cn(
          "mb-6 font-medium grid grid-cols-1 items-center gap-x-4 gap-y-4 text-xs text-foreground",
        )}
      >
        <InvestForm sale={sale} openModal={setOpen}>
          <DiscountBanner sale={sale} />
        </InvestForm>
      </div>
      <TokenInvestModals open={open} handleModal={setOpen} sale={sale} />
      {open && open === TransactionModalTypes.VerifyEmail && (
        <VerifyMandatoryEmail email={user?.email || ""} />
      )}
    </CardContainer>
  );
}
