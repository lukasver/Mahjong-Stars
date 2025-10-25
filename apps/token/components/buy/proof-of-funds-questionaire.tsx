"use client";

import { getGlassyCardClassName } from "@mjs/ui/components/cards";
import { cn } from "@mjs/ui/lib/utils";
import { Button } from "@mjs/ui/primitives/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@mjs/ui/primitives/card";
import { useAppForm } from "@mjs/ui/primitives/form";
import { Progress } from "@mjs/ui/primitives/progress";
import { CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Stepper } from "@/components/stepper";
import {
  BankingDetailsStep,
  EmploymentIncomeStep,
  FundsOriginStep,
  TransactionPurposeStep,
  WealthBackgroundStep,
} from "./steps";
import { QuestionnaireData, QuestionnaireSchema } from "./steps/types";

interface ProofOfFundsQuestionnaireProps {
  onComplete?: (data: QuestionnaireData) => void;
  showWealthBackground?: boolean;
}

export function ProofOfFundsQuestionnaire({
  onComplete,
  showWealthBackground = false,
}: ProofOfFundsQuestionnaireProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const totalSteps = showWealthBackground ? 5 : 4;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const form = useAppForm({
    validators: {
      onSubmit: QuestionnaireSchema,
    },
    defaultValues: {
      occupation: "",
      company: "",
      monthlyIncome: "",
      fundsSource: "",
      fundsCountry: "",
      accountOwnership: "",
      thirdPartyContribution: "",
      transactionPurpose: "",
      purchasingFor: "",
      futureTransactions: "",
      // wealthDescription: "",
    },
    onSubmit: ({ value }) => {
      onComplete?.(value);
    },
  });

  const steps = [
    {
      title: "Employment & Income",
      description: "Help us understand your income sources",
      fields: ["occupation", "company", "monthlyIncome"],
    },
    {
      title: "Funds Origin",
      description: "Tell us about the source of your funds",
      fields: ["fundsSource", "fundsCountry"],
    },
    {
      title: "Payment",
      description: "Information about your transaction channel",
      fields: ["accountOwnership", "thirdPartyContribution"],
    },
    {
      title: "Transaction Purpose",
      description: "Help us understand your transaction intent",
      fields: ["transactionPurpose", "purchasingFor", "futureTransactions"],
    },
    ...(showWealthBackground
      ? [
        {
          title: "Wealth Background",
          description: "Additional information for high-value transactions",
          fields: ["wealthDescription"],
        },
      ]
      : []),
  ];

  // Transform steps for the custom Stepper component
  const stepperSteps = steps.map((step, index) => ({
    id: index,
    name: step.title,
    description: step.description,
  }));

  const isStepValid = (values: QuestionnaireData) => {
    const currentFields = steps[currentStep]?.fields;
    if (!currentFields) return false;
    const isValid = currentFields.every((field) => {
      const value = values[field as keyof QuestionnaireData];
      const isFieldValid = value && value.toString().trim() !== "";
      return isFieldValid;
    });
    return isValid;
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      form.handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  return (
    <div className="w-full mx-auto space-y-6 p-4">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-foreground">
            Step {currentStep + 1} of {totalSteps}
          </span>
          <span className="text-muted-foreground">
            {Math.round(progress)}% Complete
          </span>
        </div>
        <Progress
          value={progress}
          className="h-2 bg-zinc-800"
          indicatorClassName="bg-secondary-500"
        />
      </div>

      {/* Step Indicators */}
      <Card
        className={cn(
          getGlassyCardClassName("p-0 sm:pt-0 sm:p-6"),
          "hidden sm:block",
        )}
      >
        <Stepper
          disableClick
          currentStep={currentStep}
          steps={stepperSteps}
          onStepClick={setCurrentStep}
          className="w-full max-w-full overflow-x-auto scrollbar-hidden"
        />
      </Card>
      {/* Form Card */}
      <Card className={getGlassyCardClassName("px-2 sm:px-4")}>
        <CardHeader>
          <CardTitle className="text-2xl">
            {steps[currentStep]?.title}
          </CardTitle>
          <CardDescription className="text-base">
            {steps[currentStep]?.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form.AppForm>
            {/* Step 0: Employment & Income */}
            {currentStep === 0 && <EmploymentIncomeStep />}

            {/* Step 1: Funds Origin */}
            {currentStep === 1 && <FundsOriginStep />}

            {/* Step 2: Banking Details */}
            {currentStep === 2 && <BankingDetailsStep />}

            {/* Step 3: Transaction Purpose */}
            {currentStep === 3 && <TransactionPurposeStep />}

            {/* Step 4: Wealth Background (Optional) */}
            {currentStep === 4 && showWealthBackground && (
              <WealthBackgroundStep />
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-6 border-t">
              <form.Subscribe
                selector={(state) => ({
                  isValid: state.isValid,
                  isSubmitting: state.isSubmitting,
                  isStepValid: isStepValid(state.values),
                })}
              >
                {({ isSubmitting, isStepValid }) => (
                  <>
                    {process.env.NODE_ENV === "development" && (
                      <div className="gap-2 flex-0 hidden sm:flex">
                        <Button
                          variant="outline"
                          onClick={() => console.log(form.state.errors)}
                        >
                          CHECK ERRORS
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => console.log(form.state.values)}
                        >
                          CHECK values
                        </Button>
                      </div>
                    )}
                    <Button
                      variant="outline"
                      onClick={handleBack}
                      disabled={currentStep === 0 || isSubmitting}
                    >
                      <ChevronLeft className="size-4 mr-2" />
                      Back
                    </Button>

                    <Button
                      onClick={handleNext}
                      disabled={!isStepValid}
                      loading={isSubmitting}
                    >
                      {currentStep === totalSteps - 1 ? (
                        <>
                          Complete
                          <CheckCircle2 className="size-4 ml-2" />
                        </>
                      ) : (
                        <>
                          Continue
                          <ChevronRight className="size-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </>
                )}
              </form.Subscribe>
            </div>
          </form.AppForm>
        </CardContent>
      </Card>

      {/* Help Text */}
      {/* <div className="text-center text-sm text-muted-foreground">
        <p>
          This information is collected in accordance with FATF and BVI FSC best
          practices
        </p>
      </div> */}
    </div>
  );
}
