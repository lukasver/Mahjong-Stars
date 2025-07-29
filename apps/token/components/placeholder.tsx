import { FileX } from 'lucide-react';

export function Placeholder({
  icon: Icon = FileX,
  title = 'No documents found',
  description = 'There are no documents to display in this section.',
  className = '',
}: {
  icon?: React.ElementType;
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-8 px-4 text-center ${className}`}
    >
      <div className='rounded-full bg-muted p-3 mb-4'>
        <Icon className='h-6 w-6 text-muted-foreground' />
      </div>
      <h3 className='font-medium text-sm text-foreground mb-1'>{title}</h3>
      <p className='text-xs text-secondary max-w-[250px]'>{description}</p>
    </div>
  );
}
