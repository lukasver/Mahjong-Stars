'use client';

import { useEffect } from 'react';
import { CardContent, CardHeader, CardTitle } from '@mjs/ui/primitives/card';
import { VisuallyHidden } from '@mjs/ui/primitives/visually-hidden';
import { SuccessContent } from './success-content';

/**
 * Confirmation Step
 * Shows the success content after all steps are completed.
 */
export function ConfirmationStep() {
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }, []);

  return (
    <CardContent>
      <CardHeader>
        <VisuallyHidden>
          <CardTitle>Confirmation</CardTitle>
        </VisuallyHidden>
      </CardHeader>
      <SuccessContent />
    </CardContent>
  );
}
