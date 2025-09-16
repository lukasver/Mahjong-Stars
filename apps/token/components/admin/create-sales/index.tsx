"use client";

import { getGlassyCardClassName } from "@mjs/ui/components/cards";
import ErrorBoundary from "@mjs/ui/components/error-boundary";
import {
  AnimatePresence,
  FadeAnimation,
  motion,
} from "@mjs/ui/components/motion";
import { Button } from "@mjs/ui/primitives/button";
import { Card } from "@mjs/ui/primitives/card";
import { useAppForm } from "@mjs/ui/primitives/form/index";
import { toast } from "@mjs/ui/primitives/sonner";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAction } from "next-safe-action/hooks";
import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
import { useCallback } from "react";
import { InformationSchemaAsStrings } from "@/common/schemas/dtos/sales/information";
import { useSensitiveAction } from "@/components/hooks/use-sensitive-action";
import { Stepper } from "@/components/stepper";
import { getFileUploadPublicPresignedUrl } from "@/lib/actions";
import {
  associateBankDetailsToSale,
  createSaftContract,
  updateSale,
  upsertSale,
} from "@/lib/actions/admin";
import { useSale } from "@/lib/services/api";
import { getQueryClient } from "@/lib/services/query";
import { uploadFile } from "@/lib/utils/files";
import {
  PaymentInformation,
  ProjectInformation,
  SaftInformation,
  SectionContainer,
  TokenInformation,
} from "./sections";
import { FormFooter } from "./sections/footer";
import { FileType, getSteps, SaleFormSchema, SaleSchemas } from "./utils";

export const CreateSaleForm = () => {
  const router = useRouter();
  const [step, setStep] = useQueryState(
    "step",
    parseAsInteger.withDefault(1).withOptions({ shallow: true }),
  );
  const [saleId, setSaleId] = useQueryState(
    "saleId",
    parseAsString.withDefault(""),
  );
  const t = useTranslations("admin.sales.create");
  const { data } = useSale(saleId);
  const steps = getSteps(t);

  const sale = data?.sale;

  const saleAction = useAction(upsertSale);
  const saftAction = useAction(createSaftContract);
  const informationAction = useAction(updateSale);
  const bankDetailsAction = useAction(associateBankDetailsToSale);

  // Sensitive action hook for wallet authentication
  const sensitiveAction = useSensitiveAction({
    action: "edit_sale",
    saleId,
    data: { step: steps.find((s) => s.id === step)?.name },

    onError: (error) => {
      toast.error(`Authentication failed: ${error}`);
    },
  });

  const form = useAppForm({
    validators: {
      onSubmit: SaleSchemas[step as keyof typeof SaleSchemas] || SaleFormSchema,
    },
    defaultValues: {},

    onSubmitInvalid: ({ formApi }) => {
      const { fields } = formApi.getAllErrors();
      const allErrors: string[] = [];

      if (fields) {
        Object.entries(fields).forEach(([fieldName, fieldValue]) => {
          fieldValue.errors.forEach((error) => {
            // @ts-expect-error wontfix
            allErrors.push(`${fieldName}: ${error.message}`);
          });
        });
        toast.error(allErrors.join("\n"));
      } else {
        toast.error("Please check errors in the form");
      }
    },

    onSubmit: async ({ value, formApi }) => {


      const queryClient = getQueryClient();

      try {
        // Execute with wallet authentication for sensitive actions
        const success = await sensitiveAction.executeAction(async () => {
          if (step === 1) {
            const vals = SaleSchemas[1].parse(value);


            if (saleId) {
              vals.id = saleId;
            }
            //Create sale and update query params to reflect the current saleId
            const res = await saleAction.executeAsync(vals);

            if (res?.data) {
              setSaleId(res.data.sale.id);
              // Go to next step
              setStep((pv) => pv + 1);
              queryClient.invalidateQueries({ queryKey: ["sales"] });
            } else {
              throw new Error(
                res?.serverError ||
                res?.validationErrors?._errors?.join(", ") ||
                "Error creating sale",
              );
            }
          }
          if (step === 2) {
            const vals = SaleSchemas[2].parse(value);
            const f = formApi.getFieldMeta("content");

            if (sale?.saftCheckbox === true && !vals.content) {
              toast.error("Please fill in the Saft contract");
              return;
            }
            if (f?.isPristine) {
              setStep((pv) => pv + 1);
              return;
            }

            // Create Saft in DB and move no the next step
            const res = await saftAction.executeAsync({
              content: vals.content,
              name: vals.name,
              description: vals.description,
              saleId,
            });
            if (res?.data) {
              setStep((pv) => pv + 1);
              queryClient.invalidateQueries({
                queryKey: ["sales", saleId, "saft"],
              });
            } else {
              throw new Error(
                res?.serverError ||
                res?.validationErrors?._errors?.join(", ") ||
                "Error creating saft",
              );
            }
          }
          if (step === 3) {
            const vals = SaleSchemas[3].parse(value);

            //Create sale and update query params to reflect the current saleId
            const res = await bankDetailsAction.executeAsync({
              banks: vals.banks,
              saleId,
            });

            if (res?.data) {
              [
                ["input", "options"],
                ["sales", saleId, "banks"],
                ["sales", saleId],
              ].forEach((key) => {
                queryClient.invalidateQueries({
                  queryKey: key,
                });
              });

              setStep((pv) => pv + 1);
            } else {
              throw new Error(
                res?.serverError ||
                res?.validationErrors?._errors?.join(", ") ||
                "Error associating bank details",
              );
            }
          }
          if (step === 4) {
            const values = SaleSchemas[4].parse(value);
            const fileValues = values.information.filter(
              (item) => item.type === "file",
            ) as unknown as FileType[];
            let uploadedFiles: {
              type: "file";
              value: string;
              label: string;
            }[] = [];
            const nonFileValues = values.information.filter(
              (item) => item.type !== "file",
            );
            if (fileValues.length > 0) {
              const uploads = await Promise.all(
                fileValues.map(async ({ value }) => {
                  const fileName = `sale/${saleId}/${(value as File).name}`;
                  return getFileUploadPublicPresignedUrl({
                    key: fileName,
                  }).then(async (url) => {
                    if (url?.data) {
                      return uploadFile(
                        { file: value as File, name: fileName },
                        url.data.url,
                      );
                    } else {
                      throw new Error("Error getting presigned url");
                    }
                  });
                }),
              );

              uploadedFiles = fileValues.map((file, i) => ({
                type: "file",
                label: file.label,
                value: uploads[i]?.fileName!,
                props: file.props,
              }));
            }

            const result = await informationAction.executeAsync({
              data: InformationSchemaAsStrings.parse({
                information: [...nonFileValues, ...uploadedFiles],
              }),
              id: saleId,
            });
            if (result?.data) {
              queryClient.invalidateQueries({
                queryKey: ["sales", saleId],
              });
              toast.success("Information submitted successfully");
              router.push(`/admin/sales`);
            } else {
              throw new Error(
                result?.serverError ||
                result?.validationErrors?._errors?.join(", ") ||
                "Error submitting information",
              );
            }
          }
        });

        if (!success) {
          // Authentication failed, don't proceed with the action
          return;
        }
      } catch (e) {
        toast.error(
          `Error submitting sale: ${e instanceof Error ? e.message : "Unknown error"
          }`,
        );
      }
    },
  });

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      e.stopPropagation();
      form.handleSubmit();
    },
    [form],
  );

  return (
    <form.AppForm>
      <form onSubmit={handleSubmit}>
        <AnimatePresence mode="wait">
          <FadeAnimation delay={0.1} duration={0.5}>
            <SectionContainer
              title={saleId ? "Edit Sale" : "Create a new sale"}
              className="col-span-2"
            >
              <FormStepper steps={steps} />
              <SectionForm />

              <FormFooter steps={steps} />
            </SectionContainer>
          </FadeAnimation>
        </AnimatePresence>
        {process.env.NODE_ENV === "development" && (
          <>
            <Button onClick={() => console.debug(form.state.values)}>
              checkvalue
            </Button>
            <Button onClick={() => console.debug(form.getAllErrors())}>
              Check errors
            </Button>
          </>
        )}
      </form>
    </form.AppForm>
  );
};

const FormStepper = ({
  className,
  steps,
}: {
  className?: string;
  steps: { id: number; name: string; description: string }[];
}) => {
  const [step, setStep] = useQueryState(
    "step",
    parseAsInteger.withDefault(1).withOptions({ shallow: true }),
  );
  return (
    <Card className={getGlassyCardClassName(className)}>
      <Stepper
        currentStep={step}
        steps={steps}
        className={className}
        onStepClick={setStep}
      />
    </Card>
  );
};

const SectionForm = ({ children }: { children?: React.ReactNode }) => {
  const [step] = useQueryState(
    "step",
    parseAsInteger.withDefault(1).withOptions({ shallow: true }),
  );
  const [saleId] = useQueryState("saleId", parseAsString.withDefault(""));

  if (!step) return null;
  return (
    <ErrorBoundary fallback={<div>Error with creating sale section</div>}>
      <div className="flex flex-col gap-4 min-h-[300px] h-full">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key={1}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <TokenInformation saleId={saleId} step={step} />
            </motion.div>
          )}
          {step === 2 && (
            <motion.div
              key={2}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <SaftInformation saleId={saleId} />
            </motion.div>
          )}
          {step === 3 && (
            <motion.div
              key={3}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <PaymentInformation saleId={saleId} />
            </motion.div>
          )}
          {step === 4 && (
            <motion.div
              key={4}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <ProjectInformation saleId={saleId} />
            </motion.div>
          )}
        </AnimatePresence>
        {children}
      </div>
    </ErrorBoundary>
  );
};
