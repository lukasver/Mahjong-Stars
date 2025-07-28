import { cn } from '@mjs/ui/lib/utils';
import React from 'react';

function BackgroundWrapper({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('relative', className)}>
      {children}
      <div className='absolute inset-0 bg-[url(/static/images/bg2-ov.png)] bg-cover bg-center -z-50!' />
    </div>
  );
}

export default BackgroundWrapper;
