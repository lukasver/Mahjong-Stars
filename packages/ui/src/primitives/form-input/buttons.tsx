import { useFormContext } from '../form/tanstack-form';

export function SubscribeButton({ label }: { label: string }) {
  const form = useFormContext();
  return (
    <form.Subscribe selector={(state) => state.isSubmitting}>
      {(isSubmitting) => (
        <button type='submit' disabled={isSubmitting}>
          {label}
        </button>
      )}
    </form.Subscribe>
  );
}
