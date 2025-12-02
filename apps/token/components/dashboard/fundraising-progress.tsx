"use client";
import { getGlassyCardClassName } from "@mjs/ui/components/cards";
import { motion } from "@mjs/ui/components/motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@mjs/ui/primitives/card";
import { Progress } from "@mjs/ui/primitives/progress";
import { CheckCircle, Trophy } from "lucide-react";
import { DateTime } from "luxon";
import { useTranslations } from "next-intl";
import { defineChain } from "thirdweb";
import { TokenProvider as TokenProviderThirdweb } from "thirdweb/react";
import { Sale, SaleStatusSchema } from "@/common/schemas/generated";
import { client } from "@/lib/auth/thirdweb-client";
import { useActiveSale } from "@/lib/services/api";
import { PulseLoader } from "../pulse-loader";
import { TokenIcon, TokenName } from '../token-components';

const FinishedCard = ({
  sale,
  children,
}: {
  sale: Sale;
  children: React.ReactNode;
}) => {
  const total = sale?.initialTokenQuantity || 0;
  const sold = total; // When finished, all tokens are sold

  return (
    <div className="w-full max-w-6xl mx-auto"
      data-testid="fundraising-finished-card"
    >
      {/* Main Finished Sale Card */}
      <Card className={getGlassyCardClassName("mb-6")}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <CardHeader className="pb-4">
            <motion.div
              className="flex items-center gap-3 mb-2"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
            >
              <motion.div
                initial={{ rotate: -180, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
              >
                <CheckCircle className="w-8 h-8 text-green-400" />
              </motion.div>
              <motion.h1
                className="text-3xl font-bold text-white"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.5, ease: "easeOut" }}
              >
                {sale.name} - Completed
              </motion.h1>
            </motion.div>
            <motion.p
              className="text-red-200/80 text-lg"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5, ease: "easeOut" }}
            >
              ICO round successfully completed • Thank you for your
              participation!
            </motion.p>
          </CardHeader>
        </motion.div>

        <CardContent className="space-y-6">
          {/* Success Message */}
          <motion.div
            className="bg-green-900/20 border border-green-700/30 rounded-lg p-4"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5, ease: "easeOut" }}
          >
            <motion.div
              className="flex items-center gap-2 mb-2"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7, duration: 0.4, ease: "easeOut" }}
            >
              <motion.div
                initial={{ rotate: -360, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ delay: 0.8, duration: 0.6, ease: "easeOut" }}
              >
                <Trophy className="w-5 h-5 text-yellow-400" />
              </motion.div>
              <motion.span
                className="text-green-300 font-semibold"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9, duration: 0.3 }}
              >
                Sale Completed Successfully!
              </motion.span>
            </motion.div>
            <motion.p
              className="text-green-200/80 text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.0, duration: 0.4 }}
            >
              All tokens will be distributed according to the token distribution
              plan.
            </motion.p>
          </motion.div>

          {/* Final Stats */}
          <motion.div
            className="text-center mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.5, ease: "easeOut" }}
          >
            <motion.div
              className="text-yellow-300 text-xl font-bold mb-2"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.2, duration: 0.4, ease: "easeOut" }}
            >
              {sold.toLocaleString()} / {total.toLocaleString()}{" "}
              {sale.tokenSymbol}
            </motion.div>
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 1.3, duration: 0.8, ease: "easeOut" }}
              style={{ transformOrigin: "left" }}
            >
              <Progress
                value={100}
                className="h-2 bg-red-900/30"
                indicatorClassName="bg-gradient-to-r from-primary-main to-[#D00501]"
              />
            </motion.div>
            <motion.span
              className="text-green-300 font-semibold"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 2.5, duration: 0.4, ease: "easeOut" }}
            >
              100% SOLD OUT
            </motion.span>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4, duration: 0.5, ease: "easeOut" }}
          >
            {children}
          </motion.div>

          {/* Next Steps */}
          <motion.div
            className={getGlassyCardClassName("p-4")}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 0.5, ease: "easeOut" }}
          >
            <motion.h3
              className="text-secondary font-semibold mb-2"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.6, duration: 0.4, ease: "easeOut" }}
            >
              What's Next?
            </motion.h3>
            <motion.ul
              className="text-foreground/80 text-sm space-y-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.7, duration: 0.5 }}
            >
              <motion.li
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.8, duration: 0.3 }}
              >
                • Stay tuned for news on the token distribution
              </motion.li>
              <motion.li
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.9, duration: 0.3 }}
              >
                • Join our community for updates and announcements
              </motion.li>
            </motion.ul>
          </motion.div>
        </CardContent>
      </Card>
    </div>
  );
};

export function FundraisingProgress({
  children,
}: {
  children?: React.ReactNode;
}) {
  const t = useTranslations("dashboard.fundraisingProgress");
  const { data: sale, isLoading } = useActiveSale();


  const address = sale?.tokenContractAddress!;
  const chainId = sale?.tokenContractChainId || sale?.token?.chainId;

  // In a real app, these would come from your API or blockchain data
  const available = sale?.availableTokenQuantity || 0;
  const total = sale?.initialTokenQuantity || 0;
  const sold = total - available;
  const percentage = Math.round((sold / total) * 100);

  if (!sale) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="py-6">
        <PulseLoader />
      </div>
    );
  }

  const daysRemaining = Math.floor(
    DateTime.fromISO(sale.saleClosingDate as unknown as string).diffNow(
      "days",
    ).days,
  );

  const isFinished =
    sale?.availableTokenQuantity === 0 ||
    DateTime.fromISO(sale.saleClosingDate as unknown as string).diffNow(
      "days",
    ).days <= 0 ||
    sale?.status === SaleStatusSchema.enum.FINISHED;

  // Show finished card when sale is completed
  if (isFinished) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{
          duration: 0.6,
          scale: { type: "spring", visualDuration: 0.6, bounce: 0.2 },
        }}
      >
        <FinishedCard sale={sale}>{children}</FinishedCard>
      </motion.div>
    );
  }

  return (
    <TokenProvider
      address={address}
      chainId={chainId}
    >
      <motion.div
        data-testid="fundraising-progress"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{
          duration: 0.6,
          scale: { type: "spring", visualDuration: 0.6, bounce: 0.2 },
        }}
      >
        <Card className="border-zinc-800 bg-zinc-900/50">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <CardHeader>
              <div className='flex items-center gap-2'>
                <CardTitle className='flex items-center gap-2 flex-1'>
                  {chainId && <TokenIcon symbol={sale.tokenSymbol} chainId={chainId} />}
                  {sale.name}
                </CardTitle>
                <span className='text-xs sm:text-sm font-head font-bold' >
                  {chainId && <TokenName symbol={sale.tokenSymbol} chainId={chainId} />}
                  {/* {chainId && <TokenSymbol symbol={sale.tokenSymbol} chainId={chainId} />} */}
                </span>
              </div>
              {daysRemaining > 0 ? (
                <CardDescription>
                  {t("description", { days: daysRemaining })}
                </CardDescription>
              ) : null}
            </CardHeader>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <span className="text-xl font-bold text-secondary-500">
                      {t("tokensSold", {
                        sold: sold.toLocaleString(),
                        total: total.toLocaleString(),
                        tokenSymbol: sale.tokenSymbol,
                      })}
                    </span>
                  </div>
                  <div className="text-right font-medium">
                    {t("percentage", { percentage })}
                  </div>
                </div>
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
                  style={{ transformOrigin: "left" }}
                >
                  <Progress
                    value={percentage}
                    className="h-2 bg-zinc-800"
                    indicatorClassName="bg-secondary-500"
                  />
                </motion.div>
              </div>

              {children}
            </CardContent>
          </motion.div>
        </Card>
      </motion.div>
    </TokenProvider>
  );
}


const TokenProvider = ({ children, address, chainId }: { children: React.ReactNode, address?: string, chainId?: number | null }) => {
  if (!address || !chainId) {
    return <>{children}</>;
  }
  return (
    <TokenProviderThirdweb address={address} client={client} chain={defineChain(chainId)}>
      {children}
    </TokenProviderThirdweb>
  );
}
