"use client";

import { FormInput } from "@mjs/ui/primitives/form-input";

export function BankingDetailsStep() {
  return (
    <div className="space-y-4">

      <FormInput
        name="accountOwnership"
        type="select"
        label="Is this account in your name?"
        inputProps={{
          required: true,
          options: [
            {
              id: "yes",
              value: "yes",
              label: "Yes, the account is in my name",
            },
            { id: "joint", value: "joint", label: "Joint account" },
            {
              id: "no",
              value: "no",
              label: "No, it belongs to someone else",
            },
          ],
        }}
      />

      <FormInput
        name="thirdPartyContribution"
        type="select"
        label="Will any third parties contribute to this transaction?"
        description="This helps us detect potential third-party payments and layering"
        inputProps={{
          required: true,
          options: [
            {
              id: "no",
              value: "no",
              label: "No third-party involvement",
            },
            {
              id: "yes",
              value: "yes",
              label: "Yes, there will be third-party contributions",
            },
          ],
        }}
      />
    </div>
  );
}
