"use client";

import { FormInput } from "@mjs/ui/primitives/form-input";

export function TransactionPurposeStep() {
  return (
    <div className="space-y-4">
      <FormInput
        name="transactionPurpose"
        type="textarea"
        label="What is the intended purpose of this transaction?"
        description="This ensures alignment with legitimate business or personal purposes"
        inputProps={{
          required: true,
          placeholder: "Please describe the purpose of your transaction. For example: investment in digital assets, long-term savings, portfolio diversification, retirement planning, business capital, etc...",
        }}
      />

      <FormInput
        name="purchasingFor"
        type="select"
        label="Are you purchasing on your own behalf or for someone else?"
        inputProps={{
          required: true,
          options: [
            { id: "self", value: "self", label: "For myself" },
            {
              id: "other",
              value: "other",
              label: "For someone else",
            },
          ],
        }}
      />

      <FormInput
        name="futureTransactions"
        type="select"
        label="Do you expect to make similar transactions in the future?"
        inputProps={{
          required: true,
          options: [
            {
              id: "yes",
              value: "yes",
              label: "Yes, I expect similar transactions",
            },
            {
              id: "no",
              value: "no",
              label: "No, this is a one-time transaction",
            },
            {
              id: "unsure",
              value: "unsure",
              label: "Unsure at this time",
            },
          ],
        }}
      />
    </div>
  );
}
