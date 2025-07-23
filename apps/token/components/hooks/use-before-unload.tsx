import { useEffect } from 'react';
import { toast } from '@mjs/ui/primitives/sonner';

export const useBeforeUnload = () => {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      toast.info(
        'Please confirm or cancel the transaction before closing the page'
      );
      e.preventDefault();
      const message = 'Are you sure you want to close?';
      e.returnValue = message; //Gecko + IE
      return message;
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return function cleanupListener() {
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, []);
  return null;
};
