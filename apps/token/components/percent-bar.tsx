import { Progress } from '@mjs/ui/primitives/progress';

export const PercentBar = ({
  value = 0,
  textValue,
  caption,
  render = true,
}: {
  value?: number;
  textValue: React.ReactNode;
  caption: string;
  render?: boolean;
}) => {
  if (value === undefined || value === null || !render) return null;
  return (
    <div className='flex flex-col gap-1 w-full relative'>
      <Progress
        value={value}
        className='h-2.5 rounded bg-muted/50'
        indicatorClassName='bg-primary rounded'
      />
      <div className='flex flex-col items-end mt-1'>
        <span className='text-xs font-bold text-gray-500'>{textValue}</span>
        <span className='text-xs text-gray-500'>{caption ?? 'Hard Cap'}</span>
      </div>
    </div>
  );
};
