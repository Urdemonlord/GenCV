import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface NavItemProps extends ComponentProps<'button'> {
  icon?: ReactNode;
  active?: boolean;
  trailing?: ReactNode;
}

export function NavItem({ icon, active, trailing, className, children, ...props }: NavItemProps) {
  return (
    <button
      type="button"
      aria-current={active ? 'step' : undefined}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors [&_svg]:size-4 [&_svg]:shrink-0',
        active ? 'bg-primary/15 font-semibold text-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground',
        className
      )}
      {...props}
    >
      {icon && <span className={active ? 'text-primary' : undefined}>{icon}</span>}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {trailing}
    </button>
  );
}
