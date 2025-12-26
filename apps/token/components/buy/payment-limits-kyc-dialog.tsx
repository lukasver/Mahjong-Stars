"use client";

import { Icons } from "@mjs/ui/components/icons";
import {
  AnimatedIcon,
  AnimatedText,
  FadeAnimation,
} from "@mjs/ui/components/motion";
import { cn } from "@mjs/ui/lib/utils";
import { Badge } from "@mjs/ui/primitives/badge";
import { Button } from "@mjs/ui/primitives/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@mjs/ui/primitives/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@mjs/ui/primitives/dialog";
import { FOP } from "@prisma/client";
import { Info } from "lucide-react";
import type React from "react";
import { FOPSchema } from "@/common/schemas/generated";

type PaymentMethod = FOP | "all";

interface PaymentLimitsDialogProps {
  method?: PaymentMethod;
  trigger?: React.ReactNode;
}

interface PaymentMethodData {
  icon: React.ReactNode;
  name: string;
  description: string;
  limits: Array<{ amount: string; requirement: string }>;
  color: string;
}

interface PaymentMethodsData {
  [FOPSchema.Enum.TRANSFER]: PaymentMethodData;
  [FOPSchema.Enum.CARD]: {
    name: string;
    description: string;
    icon: React.ReactNode;
    methods: PaymentMethodData[];
  };
  [FOPSchema.Enum.CRYPTO]: PaymentMethodData;
}

const paymentMethodsData: PaymentMethodsData = {
  [FOPSchema.Enum.TRANSFER]: {
    name: "Open Banking",
    icon: <Icons.bank className="size-4" />,
    description:
      "Bank transfer solutions including SEPA, ACH, and other regional methods",
    limits: [
      { amount: "Minimum amount", requirement: "$100" },
      { amount: "$500 (per transaction)", requirement: "No KYC required" },
      { amount: "Up to $1,000/day", requirement: "No KYC required" },
      {
        amount: "Up to $2,500/day",
        requirement:
          "KYC required via Sumsub (ID verification + Liveness check)",
      },
    ],
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  },
  [FOPSchema.Enum.CARD]: {
    name: "Card Payments",
    description: "Credit and debit card payments, including digital wallets",
    icon: <Icons.creditCard className="size-4" />,
    methods: [
      {
        name: "Visa/Mastercard",
        description: "Credit and debit card payments",
        icon: <Icons.creditCard className="size-4" />,
        limits: [
          { amount: "Minimum amount", requirement: "$10" },
          {
            amount: "Up to €250",
            requirement: "Lite KYC",
          },
          {
            amount: "€250+",
            requirement: "KYC required",
          },
          { amount: "Weekly limit: $70,000", requirement: "KYC Required" },
          { amount: "Monthly limit: $120,000", requirement: "KYC Required" },
        ],
        color:
          "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      },
      {
        name: "Apple Pay",
        description: "Digital wallet payment via Apple Pay",
        icon: <Icons.applePay />,
        limits: [
          { amount: "Minimum amount", requirement: "$100" },

          {
            amount: "Up to €250",
            requirement: "Lite KYC",
          },
          {
            amount: "€250+ or 2nd transaction onwards",
            requirement: "KYC Required",
          },
          // {
          //   amount: "Max per transaction: $50,000",
          //   requirement: "KYC Required",
          // },
          { amount: "Weekly limit: $70,000", requirement: "KYC Standard" },
          { amount: "Monthly limit: $120,000", requirement: "KYC Standard" },
        ],
        color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
      },
      {
        name: "Google Pay",
        description: "Digital wallet payment via Google Pay",
        icon: <Icons.googlePay className="-mr-2!" />,
        limits: [
          { amount: "Minimum amount", requirement: "$100" },

          {
            amount: "Up to €250",
            requirement: "Lite KYC",
          },
          {
            amount: "€250+ or 2nd transaction onwards",
            requirement: "KYC Required",
          },
          // {
          //   amount: "Max per transaction: $50,000",
          //   requirement: "KYC Required",
          // },
          { amount: "Weekly limit: $70,000", requirement: "KYC Required" },
          { amount: "Monthly limit: $120,000", requirement: "KYC Required" },
        ],
        color:
          "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      },
    ],
  },
  [FOPSchema.Enum.CRYPTO]: {
    name: "Crypto payments",
    description: "Cryptocurrency payments",
    icon: <Icons.ether className="size-4" />,
    limits: [
      { amount: "Minimum amount", requirement: "N/A" },
      {
        amount: "No limits on direct crypto payments",
        requirement: "No KYC required",
      },
      {
        amount: "On-ramp via Thirdweb",
        requirement: "KYC subject to selected on-ramp provider policies",
      },
    ],
    color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  },
};

export function PaymentLimitsDialog({
  method,
  trigger,
}: PaymentLimitsDialogProps) {
  const allFopMethods = FOPSchema.options;

  const displayMethods = (() => {
    if (method === "all") {
      return allFopMethods;
    }
    if (method) {
      return [method];
    }
    return [];
  })();

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2 bg-transparent">
            <Info className="h-4 w-4" />
            Payment options & limits
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <FadeAnimation delay={0.1} duration={0.3}>
          <DialogHeader>
            <AnimatedText delay={0.15} duration={0.3}>
              <DialogTitle className="text-2xl">
                Payment options & limits
              </DialogTitle>
            </AnimatedText>
            <AnimatedText delay={0.2} duration={0.3}>
              <DialogDescription className="text-base text-secondary">
                View requirements for each payment method.
              </DialogDescription>
            </AnimatedText>
          </DialogHeader>
        </FadeAnimation>

        <div className="space-y-4">
          {displayMethods.map((methodKey, methodIndex) => {
            if (!methodKey) return null;
            const methodData = paymentMethodsData[methodKey];

            // Safety check: ensure methodData exists
            if (!methodData) return null;

            // Handle CARD which has nested methods
            if (methodKey === FOPSchema.Enum.CARD && "methods" in methodData) {
              return (
                <FadeAnimation
                  key={methodKey}
                  delay={0.25 + methodIndex * 0.1}
                  duration={0.3}
                  scale
                >
                  <div>
                    <AnimatedText
                      delay={0.3 + methodIndex * 0.1}
                      duration={0.3}
                    >
                      <div className="pb-2">
                        <h3 className="font-semibold text-lg">
                          {methodData.name}
                        </h3>
                        <p className="text-sm text-secondary">
                          {methodData.description}
                        </p>
                      </div>
                    </AnimatedText>
                    <div className="space-y-2">
                      {methodData.methods.map(
                        (
                          subMethod: PaymentMethodData,
                          subMethodIndex: number,
                        ) => (
                          <FadeAnimation
                            key={subMethod.name}
                            delay={
                              0.35 + methodIndex * 0.1 + subMethodIndex * 0.08
                            }
                            duration={0.3}
                            scale
                          >
                            <Card className="glassy">
                              <CardHeader className="flex items-start justify-between">
                                <div className="flex w-full items-start justify-between gap-2">
                                  <AnimatedText
                                    delay={
                                      0.4 +
                                      methodIndex * 0.1 +
                                      subMethodIndex * 0.08
                                    }
                                    duration={0.3}
                                    className="flex-1"
                                  >
                                    <CardTitle className="font-semibold text-lg flex-1">
                                      {subMethod.name}
                                    </CardTitle>
                                  </AnimatedText>
                                  {subMethod.name === "Apple Pay" ||
                                    subMethod.name === "Google Pay" ? (
                                    <AnimatedIcon
                                      delay={
                                        0.45 +
                                        methodIndex * 0.1 +
                                        subMethodIndex * 0.08
                                      }
                                      duration={0.3}
                                    >
                                      {subMethod.icon}
                                    </AnimatedIcon>
                                  ) : (
                                    <AnimatedIcon
                                      delay={
                                        0.45 +
                                        methodIndex * 0.1 +
                                        subMethodIndex * 0.08
                                      }
                                      duration={0.3}
                                    >
                                      <Badge
                                        className={cn(
                                          subMethod.color,
                                          "w-fit shrink-0",
                                        )}
                                      >
                                        {subMethod.icon}
                                      </Badge>
                                    </AnimatedIcon>
                                  )}
                                </div>
                                <AnimatedText
                                  delay={
                                    0.5 +
                                    methodIndex * 0.1 +
                                    subMethodIndex * 0.08
                                  }
                                  duration={0.3}
                                >
                                  <CardDescription className="text-sm text-secondary">
                                    {subMethod.description}
                                  </CardDescription>
                                </AnimatedText>
                              </CardHeader>

                              <CardContent className="space-y-2">
                                {subMethod.limits.map(
                                  (
                                    limit: {
                                      amount: string;
                                      requirement: string;
                                    },
                                    limitIndex: number,
                                  ) => (
                                    <FadeAnimation
                                      key={limitIndex}
                                      delay={
                                        0.55 +
                                        methodIndex * 0.1 +
                                        subMethodIndex * 0.08 +
                                        limitIndex * 0.05
                                      }
                                      duration={0.2}
                                    >
                                      <div className="flex items-start gap-3 text-sm">
                                        <div className="min-w-0 flex-1">
                                          <span className="font-medium">
                                            {limit.amount}:
                                          </span>
                                          <span className="text-secondary ml-2">
                                            {limit.requirement}
                                          </span>
                                        </div>
                                      </div>
                                    </FadeAnimation>
                                  ),
                                )}
                              </CardContent>
                            </Card>
                          </FadeAnimation>
                        ),
                      )}
                    </div>
                  </div>
                </FadeAnimation>
              );
            }

            // Handle other payment methods (TRANSFER, CRYPTO)
            // TypeScript knows this is PaymentMethodData because we already handled CARD above
            const standardMethodData = methodData as PaymentMethodData;
            return (
              <FadeAnimation
                key={methodKey}
                delay={0.25 + methodIndex * 0.1}
                duration={0.3}
                scale
              >
                <Card className="glassy">
                  <CardHeader className="flex items-start justify-between">
                    <div className="flex w-full items-start justify-between gap-2">
                      <AnimatedText
                        delay={0.3 + methodIndex * 0.1}
                        duration={0.3}
                        className="flex-1"
                      >
                        <CardTitle className="font-semibold text-lg flex-1">
                          {standardMethodData.name}
                        </CardTitle>
                      </AnimatedText>
                      <AnimatedIcon
                        delay={0.35 + methodIndex * 0.1}
                        duration={0.3}
                      >
                        <Badge
                          className={cn(
                            standardMethodData.color,
                            "w-fit shrink-0",
                          )}
                        >
                          {standardMethodData.icon}
                        </Badge>
                      </AnimatedIcon>
                    </div>
                    <AnimatedText
                      delay={0.4 + methodIndex * 0.1}
                      duration={0.3}
                    >
                      <CardDescription className="text-sm text-secondary">
                        {standardMethodData.description}
                      </CardDescription>
                    </AnimatedText>
                  </CardHeader>

                  <CardContent className="space-y-2">
                    {standardMethodData.limits.map(
                      (
                        limit: { amount: string; requirement: string },
                        index: number,
                      ) => (
                        <FadeAnimation
                          key={index}
                          delay={0.45 + methodIndex * 0.1 + index * 0.05}
                          duration={0.2}
                        >
                          <div className="flex items-start gap-3 text-sm">
                            <div className="min-w-0 flex-1">
                              <span className="font-medium">
                                {limit.amount}:
                              </span>
                              <span className="text-secondary-400 ml-2">
                                {limit.requirement}
                              </span>
                            </div>
                          </div>
                        </FadeAnimation>
                      ),
                    )}
                  </CardContent>
                </Card>
              </FadeAnimation>
            );
          })}

          {/* <Card className="glassy ">
            <CardHeader>
              <CardTitle className="font-semibold text-lg">
                KYC Definitions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <ul className="space-y-1 text-secondary">
                <li>
                  <strong>KYC Lite:</strong> Name, Date of Birth, Address
                  verification
                </li>
                <li>
                  <strong>KYC Standard:</strong> Full verification including
                  document upload and selfie verification
                </li>
                <li>
                  <strong>Sumsub KYC:</strong> Automated identity verification
                  with ID/Passport and liveness check
                </li>
              </ul>
            </CardContent>
          </Card> */}
        </div>
      </DialogContent>
    </Dialog>
  );
}
