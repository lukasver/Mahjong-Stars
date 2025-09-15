import { useActionListener } from "@mjs/ui/hooks/use-action-listener";
import {
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@mjs/ui/primitives/alert-dialog";
import { Button } from "@mjs/ui/primitives/button";
import { DialogFooter } from "@mjs/ui/primitives/dialog";
import { toast } from "@mjs/ui/primitives/sonner";
import { DocumentSignatureStatus } from "@prisma/client";
import { useAction } from "next-safe-action/hooks";
import { confirmContractSignature } from "@/lib/actions";

export function ContractDialogConfirmSignature({
  id,
  onSuccess,
}: {
  id: string;
  onSuccess: () => void;
}) {
  const action = useActionListener(useAction(confirmContractSignature), {
    onSuccess: (d) => {
      const recipient = (
        d as unknown as {
          recipient: { status: DocumentSignatureStatus };
        }
      )?.recipient;
      if (!recipient) {
        toast.error("Cannot verify contract status");
        return;
      }
      if (recipient.status === "SIGNED") {
        onSuccess();
      }
      if (recipient.status === "ERROR") {
        toast.error("Contract generation failed, please try again");
        return;
      }
      if (recipient.status === "CREATED") {
        toast.error(
          "Contract not sent for signature, please reach out to support or try again",
        );
        return;
      }
      if (recipient.status === "SENT_FOR_SIGNATURE") {
        toast.error("Waiting for signature, please check your email...");
        return;
      }
    },
  });

  const handleCheckStatus = (id: string) => {
    if (action.isExecuting) {
      return;
    }
    if (!id) {
      toast.error("Cannot verify contract status");
      return;
    }
    action.execute({ id });
  };
  return (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Contract sent to your email</AlertDialogTitle>
        <AlertDialogDescription className="text-secondary">
          Please review and sign the agreement on your email to proceed.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <DialogFooter>
        <Button
          variant={"accent"}
          className="w-full"
          onClick={() => handleCheckStatus(id)}
          loading={action.isExecuting}
        >
          Confirm contract is signed
        </Button>
      </DialogFooter>
    </AlertDialogContent>
  );
}
