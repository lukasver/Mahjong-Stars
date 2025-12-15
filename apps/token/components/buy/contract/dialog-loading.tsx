"use client";

import {
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@mjs/ui/primitives/alert-dialog";
import { Button } from "@mjs/ui/primitives/button";
import { DocumentSignatureStatus } from "@prisma/client";
import Image from "next/image";
import { useEffect, useState } from "react";
import MahjongStarsIconXl from "@/public/static/images/logos/isologo.webp";

interface ContractDialogLoadingProps {
  onCancel?: () => void;
  timeoutDuration?: number;
  status: DocumentSignatureStatus | undefined;
}

const SHOW_CANCEL_AFTER = 120; // Show cancel button after 2 minutes

export function ContractDialogLoading({
  onCancel,
  timeoutDuration = SHOW_CANCEL_AFTER,
  status,
}: ContractDialogLoadingProps) {
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [showCancelButton, setShowCancelButton] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed((prev) => {
        const newTime = prev + 1;

        // Show cancel button after 2 minutes
        if (newTime >= timeoutDuration && !showCancelButton) {
          setShowCancelButton(true);
        }

        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showCancelButton]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Loading...</AlertDialogTitle>
          <AlertDialogDescription className="text-secondary">
            This process can take up to 2 minutes. Please do not close the
            window.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex items-center gap-2">
          <span className="aspect-square animate-pulse">
            <Image
              height={80}
              width={80}
              src={MahjongStarsIconXl}
              alt="The Tiles Company Logo"
              className="animate-spin aspect-square"
            />
          </span>
          <span className="text-xl font-bold font-head">
            {status === "CREATED"
              ? "Sending contract to your email..."
              : "Generating contract..."}
          </span>
        </div>

        {/* Timer display */}
        <div className="flex justify-center mt-4">
          <div className="text-sm text-secondary">
            Time elapsed: {formatTime(timeElapsed)}
          </div>
        </div>

        {showCancelButton && (
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button
                variant="destructive"
                onClick={handleCancel}
                className="w-full"
              >
                Cancel
              </Button>
            </AlertDialogCancel>
          </AlertDialogFooter>
        )}
      </AlertDialogContent>
    </>
  );
}
