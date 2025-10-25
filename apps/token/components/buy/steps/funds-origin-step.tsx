"use client";

import { FormInput } from "@mjs/ui/primitives/form-input";

export function FundsOriginStep() {
  return (
    <div className="space-y-4">
      <FormInput
        name="fundsSource"
        type="select"
        label="How did you obtain the funds for this transaction?"
        description="This establishes the immediate origin of your funds"
        inputProps={{
          required: true,
          options: [
            { id: "savings", value: "savings", label: "Savings" },
            { id: "salary", value: "salary", label: "Salary" },
            {
              id: "investment",
              value: "investment",
              label: "Investment Returns",
            },
            {
              id: "asset-sale",
              value: "asset-sale",
              label: "Sale of an Asset",
            },
            {
              id: "inheritance",
              value: "inheritance",
              label: "Inheritance",
            },
            { id: "other", value: "other", label: "Other" },
          ],
        }}
      />

      <FormInput
        name="fundsCountry"
        type="text"
        label="In which country were these funds generated?"
        description="This helps us understand the geographical origin of funds"
        inputProps={{
          required: true,
          placeholder: "e.g., United States, United Kingdom",
        }}
      />
    </div>
  );
}
