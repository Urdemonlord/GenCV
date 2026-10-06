import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';

/** Placeholder block while content loads; pulses unless the user prefers reduced motion. */
export function Skeleton({ className, ...props }: ComponentProps<'div'>) {
  return <div aria-hidden="true" className={cn('rounded-md bg-surface-raised motion-safe:animate-pulse', className)} {...props} />;
}
