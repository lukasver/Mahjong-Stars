"use client";

import { FileUpload } from "@mjs/ui/components/file-upload";
import { motion } from "@mjs/ui/components/motion";
import { FileWithPreview } from "@mjs/ui/hooks/use-file-upload";
import { Button } from "@mjs/ui/primitives/button";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@mjs/ui/primitives/card";
import { useAppForm } from "@mjs/ui/primitives/form";
import { FormInput } from "@mjs/ui/primitives/form-input";
import { Label } from "@mjs/ui/primitives/label";
import { Separator } from "@mjs/ui/primitives/separator";
import { toast } from "@mjs/ui/primitives/sonner";
import { DateTime } from "luxon";
import { useAction } from "next-safe-action/hooks";
import { useCallback, useTransition } from "react";
import { z } from "zod";
import { KycTierSchema, KycTierType } from "@/common/schemas/generated";
import { FormError } from "@/components/form-error";
import { useCameraCapabilities } from "@/components/hooks/use-camera-capabilities";
import { useQuestionnaireDialog } from "@/components/hooks/use-kyc-questionaire";
import { PulseLoader } from "@/components/pulse-loader";
import {
  associateDocumentsToUser,
  getFileUploadPrivatePresignedUrl,
  updateKYCVerification,
} from "@/lib/actions";
import { useTransactionById, useUser } from "@/lib/services/api";
import { getQueryClient } from "@/lib/services/query";
import { uploadFile } from "@/lib/utils/files";
import { QuestionnaireData } from '../steps/types';

const KycUploadFormSchema = z.object({
  id: z.custom<File>((file) => file instanceof File),
  address: z.custom<File>((file) => file instanceof File),
  selfie: z.custom<File>((file) => file instanceof File).optional(),
  proofOfFunds: z
    .array(z.custom<File>((file) => file instanceof File))
    .optional(),
  sanctionsConfirmed: z.boolean(),
  pepConfirmed: z.boolean(),
  tier: z.number(),
});

interface KycUploadStepProps {
  onSuccess: () => void;
  transactionId: string;
}

const labelMappings = {
  id: "Identity Document",
  address: "Proof of Address",
  selfie: "Selfie",
  proofOfFunds: "Proof of Funds",
};

const getFilesPerTier = (
  kycTier: KycTierType | "BLOCKED",
  value: z.infer<typeof KycUploadFormSchema>,
) => {
  const files: { file: File; key: string }[] = [];
  if (kycTier === "SIMPLIFIED") {
    [
      [value.id, "id"],
      [value.address, "address"],
    ].forEach(([file, key]) => {
      if (!file) {
        throw new Error(
          `${labelMappings[key as keyof typeof labelMappings]} required`,
        );
      }
      files.push({ file: file as unknown as File, key: key as string });
    });
  }
  if (kycTier === "STANDARD") {
    [
      [value.id, "id"],
      [value.address, "address"],
      [value.selfie, "selfie"],
    ].forEach(([file, key]) => {
      if (!file) {
        throw new Error(
          `${labelMappings[key as keyof typeof labelMappings]} required`,
        );
      }
      files.push({ file: file as unknown as File, key: key as string });
    });
  }
  if (kycTier === "ENHANCED") {
    [
      [value.id, "id"],
      [value.address, "address"],
      [value.selfie, "selfie"],
    ].forEach(([file, key]) => {
      if (!file) {
        throw new Error(
          `${labelMappings[key as keyof typeof labelMappings]} required`,
        );
      }
      files.push({ file: file as unknown as File, key: key as string });
    });

    if (!value.proofOfFunds?.length) {
      throw new Error(`${labelMappings.proofOfFunds} required`);
    }
    value.proofOfFunds.forEach((file) => {
      files.push({ file: file as File, key: "proofOfFunds" });
    });
  }
  return files;
};

/**
 * KYC Document Upload Step
 * Allows user to upload up to 3 files for KYC verification.
 * Uses FileUpload component for file selection and removal.
 * On submit, uploads files using presigned URLs.
 */
export function KycUploadStep({
  onSuccess,
  transactionId,
}: KycUploadStepProps) {
  const { data: user } = useUser();
  const { data: tx, isLoading: isTxLoading } =
    useTransactionById(transactionId);

  const [isPending, startTransition] = useTransition();
  const { QuestionnaireDialog, triggerQuestionnaireDialog } =
    useQuestionnaireDialog();

  const isLoading = isTxLoading;

  const action = useAction(associateDocumentsToUser, {
    onSuccess: () => {
      const qc = getQueryClient();
      qc.invalidateQueries({ queryKey: ["transactions", transactionId] });
      qc.invalidateQueries({ queryKey: ["users", "me", "kyc"] });
      toast.success("Documents uploaded");
      onSuccess?.();
    },
    onError: ({ error }) => {
      toast.error(error.serverError || "Failed to upload documents");
    },
  });

  const updateKYCAction = useAction(updateKYCVerification);

  const kycTier: KycTierType | "BLOCKED" | undefined =
    tx?.requiresKYC || undefined;

  const form = useAppForm({
    onSubmit: async ({ value }) => {
      if (isPending) return;

      // const MAX_AMOUNT_FOR_EXTRA_KYC = new Decimal("50000");
      const values = value as unknown as z.infer<typeof KycUploadFormSchema>;
      const showWealthBackground = false;

      // new Decimal(
      //   tx?.transaction.totalAmount || 0,
      // ).gt(MAX_AMOUNT_FOR_EXTRA_KYC);

      try {
        if (!user) {
          throw new Error("User not found");
        }
        if (!kycTier) {
          throw new Error("KYC tier not found");
        }

        const files = getFilesPerTier(kycTier, values);

        if (files.length === 0) {
          throw new Error("Files are missing");
        }

        let questionnaireResult: QuestionnaireData | null = null;
        if (kycTier === KycTierSchema.enum.ENHANCED) {
          questionnaireResult =
            await triggerQuestionnaireDialog(showWealthBackground);

          if (!questionnaireResult) {
            toast.error("KyC questionnaire cancelled", {
              description: "Please complete the questionnaire to proceed.",
            });
            return;
          }
        }

        startTransition(async () => {
          const res = await Promise.all(
            files.map(async ({ file, key }) => {
              const date = DateTime.now().toFormat("yyyy-MM-dd");
              const path = `user/${user.id}/kyc/${date}/${key}-${file.name}`;
              const urlRes = await getFileUploadPrivatePresignedUrl({
                key: path,
              });
              if (!urlRes?.data?.url) {
                throw new Error("Failed to get upload URL");
              }
              return uploadFile(file, urlRes.data.url).then((result) => {
                return {
                  id: key,
                  key: path,
                  fileName: result.fileName,
                  url: result.url,
                  status: result.status,
                };
              });
            }),
          );

          if (kycTier !== "BLOCKED") {
            updateKYCAction.execute({
              ...(questionnaireResult && { questionnaire: questionnaireResult }),
              tier: kycTier,
            });
          }

          action.execute({
            type: "KYC",
            transactionId: transactionId,
            documents: res.flatMap(({ key }) => ({
              key,
            })),
          });
        });
      } catch (error) {
        console.error(error);
        toast.error(
          error instanceof Error ? error.message : "Failed to upload documents",
        );
      }
    },

    // validators: {
    //   // @ts-expect-error tanstack form types does not match the complex Schema
    //   onSubmit: KycUploadFormSchema,
    // },
    defaultValues: {
      id: null,
      address: null,
      selfie: null,
      proofOfFunds: null,
      sanctionsConfirmed: false,
      pepConfirmed: false,
      tier: kycTier || KycTierSchema.enum.SIMPLIFIED,
    },
  });

  const handleFileChange =
    (name: "id" | "address" | "selfie" | "proofOfFunds") =>
      (fileList: FileWithPreview[]) => {
        if (fileList.length > 0) {
          const isProofOfFunds = name === "proofOfFunds";
          form.setFieldValue(
            // @ts-expect-error tanstack form types does not match the complex Schema
            name,
            (isProofOfFunds
              ? fileList.map((file) => file.file)
              : (fileList[0]?.file as File)) || null,
          );
        } else {
          // @ts-expect-error tanstack form types does not match the complex Schema
          form.setFieldValue(name, null);
        }
      };

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      e.stopPropagation();
      form.handleSubmit();
    },
    [form],
  );

  return (
    <CardContent>
      {kycTier === "BLOCKED" ? (
        <FormError
          type="custom"
          message={
            "KYC verification failed or rejected, please contact support"
          }
          title="KYC Verification Rejected"
        />
      ) : (
        <form.AppForm>
          <form onSubmit={handleSubmit} className="space-y-4" data-testid="kyc-upload-form">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              <CardHeader>
                <CardTitle>KYC Document Upload</CardTitle>
                <CardDescription>
                  Please upload your documents for your KYC verification
                </CardDescription>
              </CardHeader>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              <div className="space-y-4" data-testid="kyc-upload">
                {kycTier && (
                  <KycTierComponent
                    tier={kycTier}
                    onFileChange={handleFileChange}
                  />
                )}
                {isLoading ? <PulseLoader /> : <ComplianceConfirmations />}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="space-y-2"
            >
              {/* {error && <div className="text-destructive mt-2">{error}</div>}
            {success && (
              <div className="text-success mt-2">Files uploaded successfully!</div>
            )} */}
              <Button
                className="mt-4 w-full"
                type="submit"
                variant="accent"
                // disabled={Object.keys(files).length === 0 || !isCompliant}
                disabled={isLoading}
                loading={isPending || action.isExecuting}
              >
                Submit KYC Documents
              </Button>
              {process.env.NODE_ENV === "development" && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => console.log(form.state.values)}
                >
                  CHECK VALS
                </Button>
              )}
            </motion.div>
            <QuestionnaireDialog />
          </form>
        </form.AppForm>
      )}
    </CardContent>
  );
}

const ComplianceConfirmations = () => {
  return (
    // <div className="space-y-4 rounded-2xl border p-6 border-slate-600 bg-slate-700/30">
    //   <div className="space-y-1">
    //     <h3 className="text-sm font-semibold">Compliance Confirmation</h3>
    //     <p className="text-xs text-secondary-300">
    //       Please confirm the following declarations before proceeding
    //     </p>
    //   </div>

    <div className="space-y-4">
      {/* Sanctions List Confirmation */}
      <FormInput
        name="sanctionsConfirmed"
        type="checkbox"
        label="I confirm that I am not listed on any sanctions lists, including but not limited to the United Nations (UN), Office of Foreign Assets Control (OFAC), European Union (EU), or UK HM Treasury (HMT) sanctions lists."
        inputProps={{
          required: true,
        }}
      />

      {/* PEP Confirmation */}
      <FormInput
        name="pepConfirmed"
        type="checkbox"
        label="I confirm that I am not a Politically Exposed Person (PEP), which includes current or former senior public officials, their immediate family members, or known close associates."
        inputProps={{
          required: true,
        }}
      />
    </div>
    // </div>
  );
};

interface KycTierComponentProps {
  tier: KycTierType;
  onFileChange: (
    name: "id" | "address" | "selfie" | "proofOfFunds",
  ) => (fileList: FileWithPreview[]) => void;
  onComplianceChange?: (isCompliant: boolean) => void;
}

const Tier1Component = (props: KycTierComponentProps) => {
  return (
    <>
      <div className="space-y-2">
        <Label>ID / Passport</Label>
        <FileUpload
          type="camera"
          maxSizeMB={5}
          className="w-full"
          onFilesChange={props.onFileChange("id")}
          label="Upload your ID / Passport"
        />
      </div>
      <div className="space-y-2">
        <Label>Proof of Address</Label>
        <FileUpload
          type="document"
          maxSizeMB={5}
          className="w-full"
          onFilesChange={props.onFileChange("address")}
        />
      </div>
      <Separator />
    </>
  );
};

const Tier2Component = (props: KycTierComponentProps) => {
  const { isCameraOnly, permissionState } = useCameraCapabilities();

  // Determine the appropriate type based on camera capabilities
  // If camera is available, use camera-only for better UX
  // If camera is not available, fallback to camera type (which allows file upload)
  const uploadType = isCameraOnly ? "camera-only" : "camera";

  return (
    <div className="space-y-2">
      <Label>Selfie</Label>
      {permissionState === "denied" && (
        <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md p-3">
          <strong>Camera access denied:</strong> Please refresh the page and
          give camera permission.
        </div>
      )}
      <FileUpload
        type={uploadType}
        maxSizeMB={5}
        className="w-full"
        label="Upload a photo where your face is clearly visible"
        onFilesChange={props.onFileChange("selfie")}
      />
    </div>
  );
};

const Tier3Component = (props: KycTierComponentProps) => {
  return (
    <>
      <div className="space-y-2">
        <Label>Proof of Funds</Label>
        <FileUpload
          type="document"
          maxSizeMB={5}
          multiple
          className="w-full"
          onFilesChange={props.onFileChange("proofOfFunds")}
          label="I.e. Proof of income / employment / dividends / bank statement"
        />
        <Separator />
      </div>
    </>
  );
};

const KycTierComponent = (props: KycTierComponentProps) => {
  return (
    <>
      <Tier1Component {...props} />
      {(props.tier === KycTierSchema.enum.STANDARD ||
        props.tier === KycTierSchema.enum.ENHANCED) && (
          <Tier2Component {...props} />
        )}
      {props.tier === KycTierSchema.enum.ENHANCED && (
        <Tier3Component {...props} />
      )}
    </>
  );
};
