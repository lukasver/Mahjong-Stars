"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@mjs/ui/primitives/card";
import { Dialog, DialogContent } from "@mjs/ui/primitives/dialog";
import type React from "react";
import { useCallback, useRef, useState } from "react";
import { ProofOfFundsQuestionnaire } from "../buy/proof-of-funds-questionaire";
import { QuestionnaireData } from '../buy/steps/types';

interface UseQuestionnaireDialogReturn {
  QuestionnaireDialog: React.ComponentType;
  triggerQuestionnaireDialog: (
    showWealthBackground?: boolean,
  ) => Promise<QuestionnaireData | null>;
}

export function useQuestionnaireDialog(): UseQuestionnaireDialogReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [showWealthBackground, setShowWealthBackground] = useState(false);
  const resolveRef = useRef<((value: QuestionnaireData | null) => void) | null>(
    null,
  );

  const triggerQuestionnaireDialog = useCallback(
    (showWealth = false): Promise<QuestionnaireData | null> => {
      setShowWealthBackground(showWealth);
      setIsOpen(true);

      return new Promise<QuestionnaireData | null>((resolve) => {
        resolveRef.current = resolve;
      });
    },
    [],
  );

  const handleComplete = useCallback((data: QuestionnaireData) => {
    setIsOpen(false);
    resolveRef.current?.(data);
    resolveRef.current = null;
  }, []);

  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) {
      setIsOpen(false);
      resolveRef.current?.(null);
      resolveRef.current = null;
    }
  }, []);

  const QuestionnaireDialog = useCallback(() => {
    return (
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[min(1024px,90vw)] max-h-[90vh] overflow-y-auto p-0 w-full">
          <Card className='w-full'>
            <CardHeader>
              <CardTitle>KYC Questionnaire</CardTitle>
              <CardDescription>
                Due to the nature of the transaction, we need to collect some
                additional information to comply with our KYC/AML policies.
              </CardDescription>
            </CardHeader>
            <CardContent className={'p-0 sm:pt-0 sm:p-6 '}>
              <ProofOfFundsQuestionnaire
                onComplete={handleComplete}
                showWealthBackground={showWealthBackground}
              />
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>
    );
  }, [isOpen, handleOpenChange, handleComplete, showWealthBackground]);

  return {
    QuestionnaireDialog,
    triggerQuestionnaireDialog,
  };
}
