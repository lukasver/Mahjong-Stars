"use client";
import { Badge } from "@mjs/ui/primitives/badge";
import { Card } from "@mjs/ui/primitives/card";
import { Label } from "@mjs/ui/primitives/label";
import { Switch } from "@mjs/ui/primitives/switch";
import { StaggeredRevealAnimation, AnimatedIcon, AnimatedText, FadeAnimation } from "@mjs/ui/components/motion";
import Decimal from "decimal.js";
import { AlertCircle, CheckCircle, Info } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useBalanceChecker } from "@/components/hooks/use-balance-checker";
import { usePrepareTransaction } from '@/components/hooks/use-prepare-transaction';
import { NATIVE_TOKEN_ADDRESS } from 'thirdweb';
import useActiveAccount from '@/components/hooks/use-active-account';
import { useGasEstimation } from '@/components/hooks/use-gas-estimation';


type PaymentStatusIndicatorProps = {
  amount: string;
  amountToPay: string;
  tokenAddress: string;
  isNative: boolean;
  tokenSymbol: string;
  onReadyToPay: () => void;
  onToggleGasFunds: (gas: string) => void;
};


export function PaymentStatusIndicator({
  amount,
  amountToPay,
  tokenAddress = "",
  isNative = false,
  tokenSymbol = "BNB",
  onReadyToPay,
  onToggleGasFunds,
}: PaymentStatusIndicatorProps) {
  const { activeAccount: account } = useActiveAccount();
  const [includeGasFunds, setIncludeGasFunds] = useState(false);



  const preparedTx = usePrepareTransaction({
    address: tokenAddress,
    value: amountToPay,
    // To simulate the cost of a transfer tx
    to: account?.address || NATIVE_TOKEN_ADDRESS,

  });





  const { balance } = useBalanceChecker({
    requiredAmount: amount || "1",
    tokenAddress: tokenAddress || undefined,
    isNativeToken: isNative || false,
  });

  const { gasPrice, gasCost } = useGasEstimation(amount, '0x9Eed102fB3B872A584663195612062729e6Dc497');




  // TODO!: NEed to refactor this logic since we cannot get the estimate gas cost if the user has not enough balance...

  const isSufficient = useMemo(() => {
    return balance?.greaterThanOrEqualTo(amountToPay);
  }, [balance, amountToPay]);

  const fundsDifference =
    balance?.minus(amountToPay).toSignificantDigits() || new Decimal(0);
  const positiveDifference = fundsDifference.greaterThanOrEqualTo(0);

  useEffect(() => {
    if (isSufficient) {
      onReadyToPay?.();
    }
  }, [isSufficient, onReadyToPay]);

  // useEffect(() => {
  //   console.log('USEEFFECT')
  //   if (!!preparedTx && getGasCost && !gasEstimate) {
  //     console.log('GETTING GAS COST', preparedTx)
  //     getGasCost(preparedTx);
  //   }

  // }, [!!preparedTx, getGasCost, gasEstimate])

  const estimatedGasFee = gasCost || '0';



  const handleCheckGasFunds = (checked: boolean) => {
    setIncludeGasFunds(checked);
    onToggleGasFunds?.(checked ? estimatedGasFee : "0");
  };



  return (
    <FadeAnimation duration={0.5} delay={0.1}>
      <Card className="bg-slate-700/30 rounded-lg border border-slate-600">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AnimatedIcon delay={0.2}>
                <Info className="w-5 h-5 text-secondary-500" />
              </AnimatedIcon>
              <AnimatedText delay={0.25} className="font-medium">
                Payment Status
              </AnimatedText>
            </div>
            <FadeAnimation delay={0.3} duration={0.4}>
              {isSufficient ? (
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Ready to Pay
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  Insufficient Funds
                </Badge>
              )}
            </FadeAnimation>
          </div>

          <div className="space-y-3">
            <FadeAnimation delay={0.4}>
              <div className="flex justify-between text-sm">
                <span className="text-secondary-500">Wallet Balance:</span>
                <span className="">
                  {balance?.toSignificantDigits().toString()} {tokenSymbol}
                </span>
              </div>
            </FadeAnimation>
            <FadeAnimation delay={0.45}>
              <div className="flex justify-between text-sm">
                <span className="text-secondary-500">Required Amount:</span>
                <span className="">
                  {amount} {tokenSymbol}
                </span>
              </div>
            </FadeAnimation>
            <StaggeredRevealAnimation isVisible={includeGasFunds}>
              <div className="flex justify-between text-sm">
                <span className="text-secondary-500">Est. Gas Fee:</span>
                <span className="">
                  {estimatedGasFee} {tokenSymbol}
                </span>
              </div>
            </StaggeredRevealAnimation>
            <FadeAnimation delay={0.5}>
              <div className="flex justify-between text-sm font-medium border-t pt-2">
                <span>Total Needed:</span>
                <span className="">
                  {amountToPay} {tokenSymbol}
                </span>
              </div>
            </FadeAnimation>
            <StaggeredRevealAnimation isVisible={!positiveDifference}>
              <div className="flex justify-between text-sm">
                <span
                  className={
                    positiveDifference ? "text-green-600" : "text-red-600"
                  }
                >
                  {positiveDifference ? "Surplus:" : "Shortfall:"}
                </span>
                <span
                  className={` ${positiveDifference ? "text-green-600" : "text-red-600"}`}
                >
                  {fundsDifference.abs().toSignificantDigits().toFixed(8)}{" "}
                  {tokenSymbol}
                </span>
              </div>
            </StaggeredRevealAnimation>
          </div>

          {/* Gas Funds Toggle */}
          {estimatedGasFee !== "0" && <FadeAnimation delay={0.6}>
            <div className="flex items-center space-x-2 mt-4 pt-4 border-t">
              <Switch
                id="gas-funds"
                checked={includeGasFunds}
                onCheckedChange={handleCheckGasFunds}
              />
              <Label htmlFor="gas-funds" className="text-sm">
                Purchase extra funds for gas fees? (~{estimatedGasFee} {tokenSymbol})
              </Label>
            </div>
          </FadeAnimation>}
        </div>
      </Card>
    </FadeAnimation>
  );
}
