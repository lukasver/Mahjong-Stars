"use client";

import { FormInput } from "@mjs/ui/primitives/form-input";

export function EmploymentIncomeStep() {
  return (
    <div className="space-y-4">
      <FormInput
        name="occupation"
        type="text"
        label="Current Occupation or Main Source of Income"
        description="This helps us confirm your income level matches transaction activity"
        inputProps={{
          required: true,
          placeholder: "e.g., Software Engineer, Business Owner, Retired",
        }}
      />

      <FormInput
        name="company"
        type="text"
        label="Company or Organization"
        inputProps={{
          required: true,
          placeholder: "e.g., Acme Corp, Self-employed",
        }}
      />

      <FormInput
        name="monthlyIncome"
        type="select"
        label="Approximate Monthly Income"
        inputProps={{
          required: true,
          options: [
            { id: "0-25k", value: "0-25k", label: "$0 - $25,000" },
            {
              id: "25k-50k",
              value: "25k-50k",
              label: "$25,000 - $50,000",
            },
            {
              id: "50k-100k",
              value: "50k-100k",
              label: "$50,000 - $100,000",
            },
            {
              id: "100k-250k",
              value: "100k-250k",
              label: "$100,000 - $250,000",
            },
            { id: "250k+", value: "250k+", label: "$250,000+" },
          ],
        }}
      />
    </div>
  );
}
