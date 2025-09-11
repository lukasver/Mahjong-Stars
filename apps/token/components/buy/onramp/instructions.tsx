import { Alert, AlertDescription } from "@mjs/ui/primitives/alert";
import { CheckCircle, Coins, CreditCard } from "lucide-react";



export const PaymentInstructions = () => {
  return (
    <ol className="flex flex-col gap-4 justify-between items-center h-full">
      {paymentSteps.map((step) => (
        <li key={step.id}>
          <Alert className={step.alertClassName}>
            <div className="flex-shrink-0">
              <div
                className={`w-8 h-8 rounded-full ${step.stepNumberBg} flex items-center justify-center font-semibold ${step.stepNumberText}`}
              >
                {step.id}
              </div>
            </div>
            <AlertDescription className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <step.icon className="h-4 w-4" />
                <h3 className="font-semibold">{step.title}</h3>
                {/* <Badge variant={step.badge.variant}>{step.badge.text}</Badge> */}
              </div>
              <p className="text-sm text-secondary-500 leading-relaxed">
                {step.description}
              </p>
            </AlertDescription>
          </Alert>
        </li>
      ))}
    </ol>
  );
};

const paymentSteps = [
  {
    id: 1,
    icon: CreditCard,
    title: "FIAT On-Ramping",
    badge: { text: "Thirdweb Payments", variant: "secondary" as const },
    description:
      "Add funds to your wallet using your credit card. Select between a series of providers your prefered quote and fund your wallet seamlessly.",
    stepNumberBg: "bg-foreground",
    stepNumberText: "text-sm text-background",
    alertClassName:
      "flex gap-4 p-4 bg-[#141418] rounded-t-[20px] rounded-b-none border-ring",
  },
  {
    id: 2,
    icon: Coins,
    title: "Purchase Crypto",
    badge: { text: "Multiple Options", variant: "outline" as const },
    description:
      "You need to buy funds in any supported cryptocurrency to pay for the purchased tokens. Choose from our supported currencies based on your preference and availability.",
    stepNumberBg: "bg-foreground",
    stepNumberText: "text-sm text-background",
    alertClassName: "flex gap-4 p-4 bg-[#141418] rounded-none border-ring",
  },
  {
    id: 3,
    icon: CheckCircle,
    title: "Pay for your tokens",
    badge: { text: "Final Step", variant: "default" as const },
    description:
      "When you have enough funds on your wallet, you will be able to execute the payment transaction and confirm your purchase",
    stepNumberBg: "bg-foreground",
    stepNumberText: "text-sm text-background",
    alertClassName:
      "flex gap-4 p-4 bg-[#141418] rounded-b-[20px] rounded-t-none border-ring",
  },
];
