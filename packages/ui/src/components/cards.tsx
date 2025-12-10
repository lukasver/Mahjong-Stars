import {
  CardContent,
  CardDescription,
  CardHeader,
  Card as CardPrimitive,
  CardTitle,
} from '@mjs/ui/primitives/card';
import type { ReactNode } from 'react';
import { cn } from '../lib/utils';
import { Icon } from './icons';

export function ExampleCard({
  title,
  children,
  href,
}: {
  title: string;
  children: ReactNode;
  href: string;
}) {
  return (
    <a
      className='group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-neutral-700 hover:bg-neutral-800/30'
      href={`${href}?utm_source=create-turbo&utm_medium=with-tailwind&utm_campaign=create-turbo"`}
      rel='noopener noreferrer'
      target='_blank'
    >
      <h2 className='mb-3 text-2xl font-semibold'>
        {title}{' '}
        <span className='inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none'>
          -&gt;
        </span>
      </h2>
      <p className='m-0 max-w-[30ch] text-sm opacity-50'>{children}</p>
    </a>
  );
}
export function Card({
  children,
  title,
  icon,
  className,
}: {
  children: React.ReactNode;
  title: string;
  icon?: string;
  className?: string;
}) {
  return (
    <CardPrimitive
      className={cn(
        'bg-white dark:bg-black text-black dark:text-white shadow-lg!',
        className
      )}
    >
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2 text-primary'>
        {icon && <Icon icon={icon} className='h-4 w-4 text-current' />}
        <CardTitle className='text-xl font-bold text-current'>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </CardPrimitive>
  );
}

export const GlassyCard = ({
  children,
  title,
  icon,
  className,
}: {
  children: React.ReactNode;
  title: string;
  icon?: string;
  className?: string;
}) => {
  return (
    <CardPrimitive className={getGlassyCardClassName(className)}>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-xl font-bold'>{title}</CardTitle>
        <Icon icon={icon} className='h-4 w-4' />
      </CardHeader>
      <CardContent>{children}</CardContent>
    </CardPrimitive>
  );
};

export function getGlassyCardClassName(className?: string) {
  return cn('glassy text-foreground', className);
}


interface CardContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  id?: string;
  children?: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
  header?: React.ReactNode;
  contentClassName?: string;
  glassy?: boolean;
}

export const CardContainer = ({
  children,
  title,
  description,
  className,
  header,
  contentClassName,
  glassy = true,
  ...rest
}: CardContainerProps) => {

  return (
    <CardPrimitive
      className={cn(glassy ? getGlassyCardClassName(className) : className)}
      {...rest}
    >
      {header ? (
        header
      ) : (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      )}
      <CardContent className={cn('space-y-6', contentClassName)}>
        {children}
      </CardContent>
    </CardPrimitive>
  );
};
