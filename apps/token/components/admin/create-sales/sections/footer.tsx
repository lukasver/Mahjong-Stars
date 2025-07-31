import { cn } from '@mjs/ui/lib/utils';
import { Button } from '@mjs/ui/primitives/button';
import { UseAppForm, useFormContext } from '@mjs/ui/primitives/form';
import { parseAsInteger, useQueryState } from 'nuqs';
import { SensitiveActionWrapper } from '../sensitive-action-wrapper';

export const FormFooter = ({
  steps,
  saleId,
}: {
  steps: { id: number; name: string }[];
  saleId?: string;
}) => {
  const [step, setStep] = useQueryState(
    'step',
    parseAsInteger.withDefault(1).withOptions({ shallow: true })
  );
  // https://github.com/TanStack/form/discussions/1335#discussioncomment-12685109
  const form = useFormContext() as unknown as UseAppForm;

  return (
    <div className='flex justify-between w-full'>
      <Button
        className={cn(step === 1 && 'invisible pointer-events-none')}
        variant='outline'
        type={'button'}
        onClick={() => setStep(step - 1)}
      >
        Back
      </Button>
      <SensitiveActionWrapper
        action='edit_sale'
        data={{ step, saleId }}
        enabled={!!saleId}
      >
        <form.SubmitButton className='min-w-32'>
          {step === steps.length ? 'Finish' : 'Next'}
        </form.SubmitButton>
      </SensitiveActionWrapper>
    </div>
  );
};
