import ErrorBoundary from "@mjs/ui/components/error-boundary";
import { TransactionStatus } from "@prisma/client";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import {
  TransactionStatusSchema
} from "@/common/schemas/generated";
import { VerifyMandatoryEmail } from "@/components/buy/verify-mandatory-email";
import { getTransactionById } from "@/lib/actions";
import { getCurrentUser } from "@/lib/services/fetchers.server";
import { TransactionConfirmation } from "./confirmation";

const idGen = () => {
  let id = 1;
  return () => {
    return id++;
  };
};

const STEP_NAMES = {
  KYC: "KYC",
  SAFT: "SAFT",
  Payment: "Payment",
  Confirmation: "Confirmation",
} as const;

const getSteps = (
  {
    requiresKYC,
    requiresSAFT,
  }: {
    requiresKYC?: boolean;
    requiresSAFT?: boolean;
  },
) => {
  const id = idGen();

  const steps: { id: number; name: string; description: string }[] = [];
  // If sale requires KYC and user has not done it, then add the step
  if (requiresKYC) {
    steps.push({
      id: id(),
      name: STEP_NAMES.KYC,
      description: "KYC",
    });
  }
  if (requiresSAFT) {
    steps.push({
      id: id(),
      name: STEP_NAMES.SAFT,
      description: "SAFT",
    });
  }

  return steps.concat([
    { id: id(), name: STEP_NAMES.Payment, description: "Payment" },
    { id: id(), name: STEP_NAMES.Confirmation, description: "Confirmation" },
  ]);
};

export default async function TransactionConfiramationPage({
  params,
  searchParams,
}: PageProps<'/dashboard/buy/[tx]'>) {
  const queryClient = new QueryClient();
  const [p, user, sp] = await Promise.all([params, getCurrentUser(), searchParams]);

  const tx = await queryClient.fetchQuery({
    queryKey: ["transactions", p.tx],
    queryFn: () => getTransactionById({ id: p.tx }),
  });

  if (!tx?.data) {
    notFound();
  }

  const requiresKYC = !!tx?.data?.requiresKYC;
  const requiresSAFT = tx?.data?.requiresSAFT;
  const steps = getSteps({
    requiresKYC,
    requiresSAFT,
  });
  const status = tx.data.transaction.status;
  if (
    status === TransactionStatusSchema.enum.CANCELLED ||
    status === TransactionStatusSchema.enum.REJECTED
  ) {
    redirect(`/dashboard/buy/${tx.data.transaction.id}/failure`);
  }

  if (status === TransactionStatusSchema.enum.PAYMENT_SUBMITTED) {
    redirect(`/dashboard/buy/${tx.data.transaction.id}/success`);
  }

  if (tx.data.requiresKYC === "BLOCKED") {
    redirect(`/dashboard/buy/${tx.data.transaction.id}/failure?code=KYC_BLOCKED`);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ErrorBoundary fallback={<div>Error</div>}>
        <Suspense fallback={null} key={`steps-${steps.length}-${tx?.data?.requiresKYC || ''}`}>
          <TransactionConfirmation
            steps={steps}
            initialStep={getInitialStep(tx.data.transaction.status, steps)}
            transactionId={tx.data.transaction.id}
          />
        </Suspense>

        {(!user?.data?.emailVerified || !user?.data?.email) && (
          <VerifyMandatoryEmail email={user?.data?.email || ""} />
        )}
      </ErrorBoundary>
    </HydrationBoundary>
  );
}

const getInitialStep = (
  status: TransactionStatus,
  steps: { id: number; name: string; description: string }[],
) => {
  const defaultStep = steps[0]!;
  switch (status) {
    case TransactionStatusSchema.enum.AWAITING_PAYMENT:
      return steps.find((s) => s.name === STEP_NAMES.Payment) || defaultStep;
    case TransactionStatusSchema.enum.PAYMENT_SUBMITTED:
      return (
        steps.find((s) => s.name === STEP_NAMES.Confirmation) || defaultStep
      );
    case TransactionStatusSchema.enum.PAYMENT_VERIFIED:
      return (
        steps.find((s) => s.name === STEP_NAMES.Confirmation) || defaultStep
      );
    default:
      return defaultStep;
  }
};
