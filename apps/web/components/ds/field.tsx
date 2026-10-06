import { useId, type ComponentProps, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

const controlClass =
  'w-full rounded-lg border border-input bg-background/60 px-3 text-sm text-foreground placeholder:text-muted-foreground/70 transition-colors hover:border-muted-foreground/40 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-destructive';

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return <input className={cn(controlClass, 'h-10', className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return <textarea className={cn(controlClass, 'min-h-[96px] py-2 leading-relaxed', className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<'select'>) {
  return <select className={cn(controlClass, 'h-10 pr-8', className)} {...props} />;
}

interface FieldProps {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  className?: string;
  /** Receives the generated id and aria props so the label and message are linked to the control. */
  children: (control: { id: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean }) => ReactNode;
}

export function Field({ label, hint, error, className, children }: FieldProps) {
  const id = useId();
  const messageId = `${id}-message`;
  // Treat falsy errors (e.g. `invalid && 'Required'`) as absent so the hint still shows.
  const message = error || hint;
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={id} className="block text-sm font-medium text-foreground/90">
        {label}
      </label>
      {children({ id, 'aria-describedby': message ? messageId : undefined, 'aria-invalid': error ? true : undefined })}
      {message && (
        <p id={messageId} className={cn('text-xs', error ? 'text-destructive' : 'text-muted-foreground')}>
          {message}
        </p>
      )}
    </div>
  );
}
