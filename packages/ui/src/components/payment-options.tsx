"use client";

import { Button } from "@mjs/ui/primitives/button";
import { Card } from "@mjs/ui/primitives/card";
import { CheckCircle2, CreditCard, Smartphone } from "lucide-react";
import type React from "react";
import { useState } from "react";

type PaymentMethod =
  | "card"
  | "ideal"
  | "bancontact"
  | "apple-pay"
  | "google-pay";

interface PaymentMethodOption {
  id: PaymentMethod;
  name: string;
  icon: React.ReactNode;
}

export default function PaymentMethodSelector() {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("card");

  const paymentMethods: PaymentMethodOption[] = [
    {
      id: "card",
      name: "Credit / Debit Card",
      icon: <CreditCard className="w-8 h-8" />,
    },
    {
      id: "ideal",
      name: "iDEAL",
      icon: (
        <div className="w-8 h-8 flex items-center justify-center bg-white rounded text-[#cc0066] font-bold text-sm">
          iD
        </div>
      ),
    },
    {
      id: "bancontact",
      name: "Bancontact",
      icon: (
        <div className="w-8 h-8 flex items-center justify-center bg-white rounded">
          <svg viewBox="0 0 24 24" className="w-6 h-6">
            <rect width="24" height="24" fill="#005498" />
            <path
              d="M4 12h16M12 4v16"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
      ),
    },
    {
      id: "apple-pay",
      name: "Apple Pay",
      icon: (
        <div className="w-8 h-8 flex items-center justify-center bg-black rounded">
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="white">
            <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
          </svg>
        </div>
      ),
    },
    {
      id: "google-pay",
      name: "Google Pay",
      icon: <Smartphone className="w-8 h-8" />,
    },
  ];

  const handleProceed = () => {
    console.log("Selected payment method:", selectedMethod);
    // Handle payment method submission
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#8B1E1E] via-[#6B1515] to-[#4A0E0E] flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-black/60 backdrop-blur-sm border-2 border-[#8B1E1E] rounded-2xl overflow-hidden">
        <div className="p-6 md:p-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">Payment</h1>
            <p className="text-red-200/70 text-sm leading-relaxed">
              Please select your preferred payment method to complete the
              transaction.
            </p>
          </div>

          {/* Important Notice */}
          <div className="mb-6 p-4 bg-[#8B1E1E]/30 border border-[#8B1E1E]/50 rounded-lg">
            <h3 className="text-red-200/90 font-semibold mb-2 text-sm">
              Important notice:
            </h3>
            <p className="text-red-200/70 text-xs leading-relaxed">
              Payments are securely processed by our payment providers. You will
              be redirected to complete your payment. This process may take a
              couple of minutes, please do not close this page.
            </p>
          </div>

          {/* Payment Methods Grid */}
          <div className="mb-8">
            <h2 className="text-white text-sm font-semibold mb-4">
              Select Payment Method
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  className={`relative flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${selectedMethod === method.id
                    ? "bg-[#8B1E1E]/40 border-[#DC143C] shadow-lg shadow-[#DC143C]/20"
                    : "bg-black/40 border-[#8B1E1E]/30 hover:border-[#8B1E1E]/60 hover:bg-black/60"
                    }`}
                >
                  <div className="flex-shrink-0 text-white">{method.icon}</div>
                  <span className="text-white font-medium text-left flex-grow">
                    {method.name}
                  </span>
                  {selectedMethod === method.id && (
                    <CheckCircle2 className="w-5 h-5 text-[#DC143C] flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Proceed Button */}
          <Button
            onClick={handleProceed}
            className="w-full bg-white hover:bg-gray-100 text-black font-semibold py-6 rounded-xl text-base transition-all shadow-lg hover:shadow-xl"
          >
            Proceed with payment
          </Button>
        </div>
      </Card>
    </div>
  );
}
