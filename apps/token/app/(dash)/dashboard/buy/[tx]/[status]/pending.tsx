"use client";
import { Button } from "@mjs/ui/primitives/button";
import { Skeleton } from "@mjs/ui/primitives/skeleton";
import { TransactionStatus } from "@prisma/client";
import { ArrowLeft, ExternalLink, Mail } from "lucide-react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { metadata } from "@/common/config/site";
import { FOPSchema } from "@/common/schemas/generated";
import { useTransactionById } from "@/lib/services/api";

/**
 * Pending status page for dashboard actions.
 * Informs the user that their transaction is in PENDING status
 * and provides an option to return to the transaction page to complete it.
 */
const Pending = () => {
  const router = useRouter();
  const { tx } = useParams();
  const t = useTranslations();
  const supportEmail = metadata.supportEmail;

  const handleBackToTransaction = () => {
    router.push(`/dashboard/buy/${tx}`);
  };

  const handleContactClick = () => {
    window.location.href = `mailto:${supportEmail}?subject=Transaction%20Review%20Inquiry`;
  };

  const { data, isLoading } = useTransactionById(tx as string, {
    refetchInterval: 5000,
  });

  useEffect(() => {
    console.debug('EFFECT ruN')
    if (data?.transaction?.status === TransactionStatus.AWAITING_PAYMENT) {
      router.push(`/dashboard/buy/${tx}/processing`);
    }
    if (data?.transaction?.status === TransactionStatus.PAYMENT_SUBMITTED) {
      router.push(`/dashboard/buy/${tx}/success`);
    }
    if (data?.transaction?.status === TransactionStatus.PAYMENT_VERIFIED) {
      router.push(`/dashboard/buy/${tx}/success`);
    }
    if (data?.transaction?.status === TransactionStatus.COMPLETED) {
      router.push(`/dashboard/buy/${tx}/success`);
    }
    if (data?.transaction?.status === TransactionStatus.CANCELLED) {
      router.push(`/dashboard/buy/${tx}/failure`);
    }
    if (data?.transaction?.status === TransactionStatus.REJECTED) {
      router.push(`/dashboard/buy/${tx}/failure`);
    }
  }, [data?.transaction?.status]);

  if (!data) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-8 rounded-xl gap-6 -mt-10 min-h-[80dvh]">
      <div className="w-24 flex justify-center">
        <Image
          src="/static/images/features4.webp"
          alt="The Tiles Company characters"
          width={96}
          height={96}
          className="rounded-lg"
        />
      </div>

      {/* Status Badge */}
      <div className="inline-flex items-center px-4 py-2 rounded-full bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800">
        {isLoading ? (
          <Skeleton className="w-24 h-6" />
        ) : (
          <span className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
            PENDING
          </span>
        )}
      </div>

      <h2 className="text-3xl font-semibold text-center leading-tight max-w-[70%] sm:max-w-full">
        {t("status.pending.title")}
      </h2>

      <div className="text-center text-base font-medium text-foreground max-w-[85%] sm:max-w-[60%] leading-7">
        {t("status.pending.text", {
          projectName: data?.transaction?.sale?.name,
        })}
      </div>

      {(data?.transaction?.txHash || data?.transaction?.id) && (
        <div className="w-full max-w-md">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {data?.transaction?.formOfPayment === FOPSchema.enum.CRYPTO
                ? "Transaction Hash:"
                : "Transaction ID:"}
            </div>
            <div className="text-sm font-mono text-gray-900 dark:text-gray-100 break-all">
              {data?.transaction?.txHash || data?.transaction?.id}
            </div>
          </div>
        </div>
      )}

      {data?.explorerUrl &&
        data?.transaction?.formOfPayment === FOPSchema.enum.CRYPTO && (
          <div className="flex items-center mt-2 mb-2">
            <a
              href={data?.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-secondary underline hover:text-primary/80 transition-colors"
            >
              {t("status.pending.transactionLink")}
              <ExternalLink size={16} className="ml-1" />
            </a>
          </div>
        )}

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
        <Button
          variant="outline"
          onClick={handleContactClick}
          className="flex-1 flex items-center gap-2"
        >
          <Mail size={16} />
          {t("status.pending.contactButton")}
        </Button>
        <Button
          variant="primary"
          onClick={handleBackToTransaction}
          className="flex-1 flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          {t("status.pending.backToTransaction")}
        </Button>
      </div>

      <div className="text-secondary mt-2 text-center">
        {t("status.pending.supportText")}{" "}
        <a href={`mailto:${supportEmail}`} className="underline">
          {supportEmail}
        </a>
      </div>
    </div>
  );
};

export default Pending;
