import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-bold transition-[background-color,border-color,color,box-shadow,filter] disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        // Flat biru royal, seperti CTA mockup Ayo Kerja (bukan gradien).
        primary: 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary-strong',
        // Kuning + bingkai biru: CTA kartu lowongan mockup ("Buat CV & Lamar").
        accent:
          'border-[1.5px] border-primary bg-brand-accent font-extrabold text-primary hover:brightness-105',
        // Putih + bingkai biru: aksi kedua kartu lowongan mockup ("Lihat Detail").
        'brand-outline':
          'border-[1.5px] border-primary bg-white font-extrabold text-primary hover:bg-surface',
        secondary: 'bg-surface text-primary hover:bg-surface-raised',
        // Bingkai biru seperti tombol "Masuk" dan filter di mockup.
        outline: 'border-[1.5px] border-primary bg-transparent text-primary hover:bg-primary/10',
        ghost: 'text-foreground-soft hover:bg-surface hover:text-primary',
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
