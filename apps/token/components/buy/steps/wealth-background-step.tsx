"use client";

import { FormInput } from "@mjs/ui/primitives/form-input";

export function WealthBackgroundStep() {
  return (
    <div className="space-y-4 bg-slate-700/30 rounded-lg border border-slate-600">
      <div className="rounded-lg bg-muted p-4 space-y-2">
        <p className="text-sm font-medium">High-Value Transaction</p>
        <p className="text-sm text-muted-foreground">
          This information is required for transactions exceeding $50,000 USD to
          comply with enhanced due diligence requirements.
        </p>
      </div>

      <FormInput
        name="wealthDescription"
        type="textarea"
        label="Please briefly describe how you accumulated your wealth"
        description="Examples: career earnings, business ownership, investments, inheritance, property sales"
        inputProps={{
          placeholder:
            "e.g., Career earnings as a senior executive over 20 years, successful business ownership, long-term investments...",
        }}
      />
    </div>
  );
}
