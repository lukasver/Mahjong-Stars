import { PulseLoader } from '@/components/pulse-loader';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@mjs/ui/primitives/dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@mjs/ui/primitives/alert-dialog';

interface DialogLoaderProps {
  /**
   * Whether to render as an AlertDialog instead of a regular Dialog
   */
  isAlertDialog?: boolean;
  /**
   * Whether the dialog is open
   */
  open: boolean;
  /**
   * Callback when the dialog should close
   */
  onOpenChange?: (open: boolean) => void;
  /**
   * The title to display in the dialog
   */
  title?: string;
  /**
   * Custom content to display instead of the default loading text
   */
  children?: React.ReactNode;
  /**
   * Additional CSS classes for the dialog content
   */
  className?: string;
  /**
   * The description to display in the dialog
   */
  description?: string;
}

/**
 * A dialog component that displays a loading state with a pulsing animation.
 * Can render as either a regular Dialog or AlertDialog based on the isAlertDialog prop.
 */
export function DialogLoader({
  isAlertDialog = false,
  open,
  onOpenChange,
  title = 'Loading...',
  children,
  className,
  description,
}: DialogLoaderProps) {
  const content = (
    <div className='flex flex-col items-center justify-center p-6'>
      <PulseLoader>{children}</PulseLoader>
    </div>
  );

  if (isAlertDialog) {
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent className={className}>
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription className='text-secondary'>
              {description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {content}
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={className}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription className='text-secondary'>
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
