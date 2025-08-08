import { FileX } from 'lucide-react';

export function Placeholder({
  icon: Icon = FileX,
  title = 'No documents found',
  description = 'There are no documents to display in this section.',
  className = '',
  children,
}: {
  icon?: React.ElementType;
  title: string;
  description: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-6 sm:py-8 px-3 sm:px-4 text-center ${className}`}
    >
      <div className='rounded-full bg-muted p-2 sm:p-3 mb-3 sm:mb-4'>
        <Icon className='h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground' />
      </div>
      <h3 className='font-medium text-xs sm:text-sm text-foreground mb-1'>
        {title}
      </h3>
      <p className='text-xs text-secondary max-w-[250px]'>{description}</p>
      {children}
    </div>
  );
}
