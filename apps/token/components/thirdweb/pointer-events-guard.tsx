'use client';

import { useEffect, useRef } from 'react';

interface PointerEventsGuardProps {
  children: React.ReactNode;
  /**
   * Whether to enable the guard. Defaults to true.
   */
  enabled?: boolean;
  /**
   * Additional selectors to monitor besides body.
   */
  additionalSelectors?: string[];
  /**
   * Whether to stop listening after fixing pointer-events. Defaults to false.
   */
  stopAfterFix?: boolean;
  /**
   * Callback when pointer-events is fixed.
   */
  onFixed?: (element: HTMLElement, selector: string) => void;
}

/**
 * Guard component specifically designed to work with thirdweb wallet library
 * that adds pointer-events: none to body element during wallet connections
 */
export function PointerEventsGuard({
  children,
  enabled = true,
  additionalSelectors = [],
  stopAfterFix = true,
  onFixed,
}: PointerEventsGuardProps) {
  const observerRef = useRef<MutationObserver | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isFixedRef = useRef(false);

  const cleanup = () => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    if (!enabled) return;

    const selectors = ['body', ...additionalSelectors];

    const fixPointerEvents = () => {
      selectors.forEach((selector) => {
        const element = document.querySelector(selector) as HTMLElement;
        if (element && element.style.pointerEvents === 'none') {
          element.style.pointerEvents = '';
          onFixed?.(element, selector);

          // Mark as fixed if stopAfterFix is enabled
          if (stopAfterFix) {
            isFixedRef.current = true;
            cleanup();
          }
        }
      });
    };

    // Initial check
    fixPointerEvents();

    // If already fixed and stopAfterFix is enabled, don't set up listeners
    if (isFixedRef.current && stopAfterFix) {
      return;
    }

    // Set up mutation observer for body
    observerRef.current = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === 'attributes' &&
          mutation.attributeName === 'style' &&
          mutation.target === document.body
        ) {
          // Debounce the fix
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
          timeoutRef.current = setTimeout(fixPointerEvents, 50);
        }
      });
    });

    // Start observing body
    observerRef.current.observe(document.body, {
      attributes: true,
      attributeFilter: ['style'],
    });

    // Periodic check as fallback
    intervalRef.current = setInterval(fixPointerEvents, 500);

    return cleanup;
  }, [enabled, additionalSelectors, stopAfterFix, onFixed]);

  return <>{children}</>;
}
