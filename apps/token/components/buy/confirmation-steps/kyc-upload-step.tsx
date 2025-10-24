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
import { Checkbox } from "@mjs/ui/primitives/checkbox";
import { Label } from "@mjs/ui/primitives/label";
import { Separator } from "@mjs/ui/primitives/separator";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useUser } from "@/lib/services/api";

interface KycUploadStepProps {
  onSuccess: () => void;
}

/**
 * KYC Document Upload Step
 * Allows user to upload up to 3 files for KYC verification.
 * Uses FileUpload component for file selection and removal.
 * On submit, uploads files using presigned URLs.
 */
export function KycUploadStep({ onSuccess }: KycUploadStepProps) {
  const { data: user } = useUser();
  // const { data: kyc } = useUserKycVerification();
  const { tx: txId } = useParams();

  const [files, setFiles] = useState<{ [k: string]: FileWithPreview }>({}); // Array of FileWithPreview
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  /**
   * Handles file selection for the input (multiple files)
   * @param fileList - Array of FileWithPreview
   */
  const handleFilesChange = (fileList: FileWithPreview[]) => {
    setFiles((prev) => ({ ...prev, documents: fileList.slice(0, 3) }));
    setError(null);
    setSuccess(false);
  };

  const handleFileChange = (name: string) => (fileList: FileWithPreview[]) => {
    setFiles((prev) => ({ ...prev, [name]: fileList[0]! }));
    setError(null);
    setSuccess(false);
  };

  /**
   * Handles the upload of all selected files.
   */
  const handleSubmit = async () => {
    // setIsSubmitting(true);
    // setError(null);
    // setSuccess(false);
    // try {
    //   invariant(user, "User id could not be found");
    //   const validFiles = files
    //     .map((f) => (isFileWithPreview(f) ? f.file : null))
    //     .filter((f): f is File => !!f);
    //   const response = await Promise.all(
    //     validFiles.map(async (file) => {
    //       const key = `user/${user.id}/kyc/${file.name}`;
    //       const urlRes = await getFileUploadPrivatePresignedUrl({ key });
    //       if (!urlRes?.data?.url) throw new Error("Failed to get upload URL");
    //       await uploadFile(file, urlRes.data.url).then();
    //       // Here i need to update our backend with refernece to the file
    //       return key;
    //     }),
    //   );
    //   const keys = response.flatMap((key) => ({ key }));
    //   await associateDocumentsToUser({
    //     documents: keys,
    //     type: "KYC",
    //     transactionId: (txId as string) || undefined,
    //   });
    //   setSuccess(true);
    //   setFiles([]);
    //   onSuccess();
    // } catch (e) {
    //   setError(e instanceof Error ? e.message : "Upload failed");
    // } finally {
    //   setIsSubmitting(false);
    // }
  };

  const kycTier: 1 | 2 | 3 = 1;

  return (
    <CardContent>
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
        <KycTierComponent tier={kycTier} onFileChange={handleFileChange} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="space-y-2"
      >
        {error && <div className="text-destructive mt-2">{error}</div>}
        {success && (
          <div className="text-success mt-2">
            Files uploaded successfully!
          </div>
        )}
        <Button
          className="mt-4 w-full"
          onClick={handleSubmit}
          variant="accent"
          disabled={isSubmitting || Object.keys(files).length === 0}
        >
          {isSubmitting ? "Uploading..." : "Submit KYC Documents"}
        </Button>
      </motion.div>
    </CardContent>
  );
}

const ComplianceConfirmations = ({
  onComplianceChange,
}: {
  onComplianceChange?: (isCompliant: boolean) => void;
}) => {
  const [sanctionsConfirmed, setSanctionsConfirmed] = useState(false);
  const [pepConfirmed, setPepConfirmed] = useState(false);

  const handleComplianceChange = (sanctions: boolean, pep: boolean) => {
    const isCompliant = sanctions && pep;
    onComplianceChange?.(isCompliant);
  };

  return (
    <div className="space-y-4 rounded-2xl border p-6 border-slate-600 bg-slate-700/30">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold">Compliance Confirmation</h3>
        <p className="text-xs text-secondary-300">
          Please confirm the following declarations before proceeding
        </p>
      </div>

      <div className="space-y-4">
        {/* Sanctions List Confirmation */}
        <div className="flex items-start gap-3">
          <Checkbox
            id="sanctions-confirmation"
            checked={sanctionsConfirmed}
            onCheckedChange={(checked) => {
              const isChecked = checked === true;
              setSanctionsConfirmed(isChecked);
              handleComplianceChange(isChecked, pepConfirmed);
            }}
            className="mt-0.5"
          />
          <label
            htmlFor="sanctions-confirmation"
            className="text-sm leading-relaxed cursor-pointer select-none"
          >
            I confirm that I am not listed on any sanctions lists, including but
            not limited to the United Nations (UN), Office of Foreign Assets
            Control (OFAC), European Union (EU), or UK HM Treasury (HMT)
            sanctions lists.
          </label>
        </div>

        {/* PEP Confirmation */}
        <div className="flex items-start gap-3">
          <Checkbox
            id="pep-confirmation"
            checked={pepConfirmed}
            onCheckedChange={(checked) => {
              const isChecked = checked === true;
              setPepConfirmed(isChecked);
              handleComplianceChange(sanctionsConfirmed, isChecked);
            }}
            className="mt-0.5"
          />
          <label
            htmlFor="pep-confirmation"
            className="text-sm leading-relaxed cursor-pointer select-none"
          >
            I confirm that I am not a Politically Exposed Person (PEP), which
            includes current or former senior public officials, their immediate
            family members, or known close associates.
          </label>
        </div>
      </div>
    </div>
  );
};

interface KycTierComponentProps {
  tier: 1 | 2 | 3;
  onFileChange: (name: string) => (fileList: FileWithPreview[]) => void;
}
const KycTierComponent = (props: KycTierComponentProps) => {
  switch (props.tier) {
    case 1:
      // ≤ $1,000 ID + Proof of Address + PEP/sanction screen
      return (
        <div className="space-y-4">
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
          <ComplianceConfirmations />
        </div>
      );
    case 2:
      // 1001 - $10,000 - ID + Address + Selfie (liveness) + AML screening
      return <div>KYC Tier 2</div>;
    // > $10,000 - All above + Proof of Funds + Source of Wealth + MLRO review

    case 3:
      return <div>KYC Tier 3</div>;
  }
};
