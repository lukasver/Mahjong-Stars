"use client";

import { cn } from "@mjs/ui/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@mjs/ui/primitives/dialog";
import { Tooltip } from "@mjs/ui/primitives/tooltip";
import { Info } from "lucide-react";
import { useEffect, useState } from "react";
import { metadata } from "@/common/config/site";

const getPaymentInfoInnerContent = ({ showSupport }: { showSupport?: boolean }) => (
  <div className="bg-[#1a0a0a] border-2 border-[#8B1E1E]/70 rounded-lg p-4 shadow-xl">
    <h4 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
      <Info className="w-4 h-4 text-[#DC143C]" />
      How does payment work?
    </h4>

    <ul className="space-y-2.5 text-xs text-red-200/90 leading-relaxed">
      <li className="flex gap-2">
        <span className="text-[#DC143C] font-bold flex-shrink-0">•</span>
        <span>
          <strong className="text-red-100">FIAT Payments</strong> are securely
          processed by our partner: <strong>Instaxchange</strong>
        </span>
      </li>
      <li className="flex gap-2">
        <span className="text-[#DC143C] font-bold flex-shrink-0">•</span>
        <span>
          Pay in your prefered FIAT currency. Funds are automatically converted
          to cryptocurrency (<strong className="text-red-100">USDC</strong>) and
          sent to the sale's wallet to pay for your tokens.
        </span>
      </li>
      <li className="flex gap-2">
        <span className="text-[#DC143C] font-bold flex-shrink-0">•</span>
        <span>
          You will receive an{" "}
          <strong className="text-red-100">email notification</strong> after
          payment succeeds or fails
        </span>
      </li>
      <li className="flex gap-2">
        <span className="text-[#DC143C] font-bold flex-shrink-0">•</span>
        <span>
          Conversion rates are determined by the market and are subject to
          change
        </span>
      </li>
      <li className="flex gap-2">
        <span className="text-[#DC143C] font-bold flex-shrink-0">•</span>
        <span>We take care of the processing fees for you 😉</span>
      </li>
      {showSupport && (
        <li className="flex gap-2">
          <span className="text-[#DC143C] font-bold flex-shrink-0">•</span>
          <span>
            Need help?{" "}
            <a
              href={`mailto:${metadata.supportEmail}`}
              className="text-red-100 hover:text-red-200 transition-colors font-bold"
            >
              Contact us
            </a>
          </span>
        </li>
      )}
    </ul>
  </div>
);

export default function PaymentInfoTooltip({
  text,
  size = "default",
  showSupport = false,
  children
}: {
  text?: string;
  size?: "default" | "small";
  showSupport?: boolean;
  children?: React.ReactNode;
}) {

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const shouldShowText = (size === "default" && !!text) || !isMobile;

  const Content = children || getPaymentInfoInnerContent({ showSupport });

  const tooltipContent = <div className="w-72">{Content}</div>;


  const buttonContent = (
    <>
      {shouldShowText ? text : null}
      <Info
        className={cn(
          "w-3.5 h-3.5 text-red-200 group-hover:text-white transition-colors",
          {
            "size-5": !shouldShowText || !text,
            "ml-2 size-4": shouldShowText && text,
          },
        )}
      />
    </>
  );

  const buttonClasses = cn(
    "inline-flex items-center justify-center rounded-full bg-[#8B1E1E]/50 border border-[#DC143C]/50 hover:bg-primary/50 transition-all",
    {
      "size-5": !shouldShowText,
      "w-fit px-3 py-1": shouldShowText,
      "cursor-help": !isMobile,
      "cursor-pointer shadow-lg font-base": isMobile,
    },
  );

  if (isMobile) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <button className={buttonClasses} aria-label="Payment information">
            {buttonContent}
          </button>
        </DialogTrigger>
        <DialogContent className="bg-[#1a0a0a] border-[#8B1E1E]/70 max-w-[calc(100%-2rem)] sm:max-w-md">
          {Content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Tooltip
      content={tooltipContent}
      side="top"
      align="center"
      classes={{
        trigger: buttonClasses,
        content: "bg-transparent border-0 p-0 shadow-none w-auto",
      }}
    >
      <button aria-label="Payment information">{buttonContent}</button>
    </Tooltip>
  );
}
