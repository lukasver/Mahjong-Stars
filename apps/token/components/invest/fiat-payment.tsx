"use client";

import { Button } from "@mjs/ui/primitives/button";
import { DialogClose } from "@mjs/ui/primitives/dialog";
import { UseAppForm, useFormContext } from "@mjs/ui/primitives/form";
import { Label } from "@mjs/ui/primitives/label";
import { RadioGroup, RadioGroupItem } from "@mjs/ui/primitives/radio-group";
import { Banknote, CreditCard } from "lucide-react";
import { useEffect } from "react";
import { z } from "zod";
import { metadata } from "@/common/config/site";
import { FOPSchema } from "@/common/schemas/generated";
import { InvestFormSchema } from "./schemas";

export function FiatPaymentSelector({
  onClick,
  disabled,
  hasBanks,
  loading,
}: {
  disabled: boolean;
  loading: boolean;
  hasBanks: boolean;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  const form = useFormContext() as unknown as UseAppForm;

  // set default value on mount
  useEffect(() => {
    const values = form.state.values as unknown as z.infer<
      typeof InvestFormSchema
    >;
    if (!values?.fop) {
      // Set default value on mount
      form.setFieldValue("fop", FOPSchema.enum.CARD);
    }
  }, []);

  return (
    <>
      <div className="border-t border-secondary-300 pt-4 space-y-4">
        <h3 className="text-lg font-semibold text-white">
          Select Payment Method
        </h3>
        <form.AppField name={"fop"}>
          {(field) => (
            <field.FormItem>
              <RadioGroup
                value={(field.state.value as string | null) || "CARD"}
                onValueChange={(value) => {
                  field.setValue(value);
                }}
                defaultValue="CARD"
              >
                <div className="space-y-3">
                  {/* Card Option */}
                  <div className="flex items-center space-x-3 p-4 border border-red-700 rounded-lg hover:bg-red-800/30 transition-colors cursor-pointer group">
                    <RadioGroupItem
                      value={FOPSchema.enum.CARD}
                      id="CARD"
                      className="border-secondary-500 text-secondary-500"
                    />
                    <Label
                      htmlFor="CARD"
                      className="flex items-center gap-3 flex-1 cursor-pointer"
                    >
                      <CreditCard className="w-5 h-5 text-secondary-300" />
                      <div className="flex-1">
                        <p className="font-semibold text-white">
                          Credit/Debit Card
                        </p>
                        <p className="text-sm text-secondary-100">
                          Visa, Mastercard, or other card payments
                        </p>
                      </div>
                    </Label>
                  </div>

                  {/* Transfer Option */}
                  {hasBanks && (
                    <div className="flex items-center space-x-3 p-4 border border-red-700 rounded-lg hover:bg-red-800/30 transition-colors cursor-pointer group">
                      <RadioGroupItem
                        value={FOPSchema.enum.TRANSFER}
                        id="TRANSFER"
                        className="border-secondary-500 text-secondary-500"
                      />
                      <Label
                        htmlFor="TRANSFER"
                        className="flex items-center gap-3 flex-1 cursor-pointer"
                      >
                        <Banknote className="w-5 h-5 text-secondary-300" />
                        <div className="flex-1">
                          <p className="font-semibold text-white">
                            Bank Transfer
                          </p>
                          <p className="text-sm text-secondary-100">
                            Direct transfer to our bank account
                          </p>
                        </div>
                      </Label>
                    </div>
                  )}
                </div>
              </RadioGroup>
            </field.FormItem>
          )}
        </form.AppField>
        {!hasBanks ? (
          <div className='text-sm'>
            <p>
              If you prefer to pay via bank transfer, or if your payment amount
              exceeds USD 1,000, please contact us at {' '}
              <a
                className="transition-all text-secondary-300 hover:underline hover:text-secondary-500"
                href={`mailto:${metadata.supportEmail}`}
              >
                {metadata.supportEmail}
              </a>
              . Our team will provide you with the necessary payment details and
              instructions.
            </p>
          </div>
        ) : null}
      </div>
      <div className="flex gap-3 pt-2 border-t border-red-700">
        <DialogClose asChild>
          <Button
            variant="outline"
          // className="border-secondary-300 text-secondary-100 hover:bg-red-900/50"
          >
            Cancel
          </Button>
        </DialogClose>
        <form.Subscribe
          selector={(state) => {
            return {
              fop: (state.values as unknown as z.infer<typeof InvestFormSchema>)
                ?.fop,
            };
          }}
        >
          {({ fop }) => {
            return (
              <Button
                type="button"
                className="flex-1 font-semibold"
                disabled={!fop || disabled}
                onClick={onClick}
                loading={loading}
              >
                Continue with{" "}
                {fop === "CARD"
                  ? "Card"
                  : fop === "TRANSFER"
                    ? "Bank Transfer"
                    : "Payment"}
              </Button>
            );
          }}
        </form.Subscribe>
      </div>
    </>
  );
}
