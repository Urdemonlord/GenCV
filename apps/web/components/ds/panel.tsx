import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function Panel({ className, ...props }: ComponentProps<'section'>) {
  return <section className={cn('rounded-xl border border-border bg-surface', className)} {...props} />;
}

interface PanelHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function PanelHeader({ title, description, icon, action, className }: PanelHeaderProps) {
  return (
    <header className={cn('flex items-start gap-3 p-4 sm:p-5', className)}>
      {icon && (
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary-soft [&_svg]:size-4">
          {icon}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </header>
  );
}
