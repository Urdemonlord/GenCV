import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-semibold transition-[background-color,border-color,color,box-shadow,filter] disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        // Gradient is reserved for the main call to action on a screen.
        primary: 'bg-gradient-brand text-white shadow-lg shadow-primary/25 hover:brightness-110',
        secondary: 'bg-surface-raised text-foreground hover:bg-accent',
        outline: 'border border-border bg-transparent text-foreground hover:border-primary/60 hover:bg-primary/10',
        ghost: 'text-muted-foreground hover:bg-accent hover:text-foreground',
        danger: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
        icon: 'size-10',
      },
    },
    defaultVariants: { variant: 'secondary', size: 'md' },
  }
);

export interface ButtonProps extends ComponentProps<'button'>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({ className, variant, size, asChild = false, type, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp
      className={cn(buttonVariants({ variant, size }), className)}
      {...(asChild ? {} : { type: type ?? 'button' })}
      {...props}
    />
  );
}
