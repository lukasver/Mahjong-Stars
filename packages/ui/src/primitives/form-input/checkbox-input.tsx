import { Slot } from '@radix-ui/react-slot';
import { cn } from '@mjs/ui/lib/utils';
import { Checkbox } from '../checkbox';

export interface CheckboxInputProps
  extends Omit<React.ComponentProps<typeof Checkbox>, 'onChange' | 'type'> {
  type: 'checkbox';
  label: string;
  options?: never;
  placeholder?: string;
  onChange?: (value: boolean) => void;
}

const CheckboxInput: React.FC<CheckboxInputProps> = (props) => {
  const {
    label,
    id,
    className,
    asChild,
    value,
    onChange,
    placeholder,
    type,
    ...rest
  } = props;
  const Wrapper = asChild ? Slot : 'div';
  return (
    <Wrapper
      className={cn('flex items-center justify-between gap-2', className)}
    >
      <Checkbox
        id={id}
        {...rest}
        checked={!!value}
        onCheckedChange={(v) => onChange?.(!!v)}
      />
      <label htmlFor={id} className='max-w-full flex-1 cursor-pointer truncate'>
        {label ?? placeholder}
      </label>
    </Wrapper>
  );
};
CheckboxInput.displayName = 'CheckboxInput';

export { CheckboxInput };
