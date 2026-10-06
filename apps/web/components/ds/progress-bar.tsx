import { cn } from '@/lib/cn';

interface ProgressBarProps {
  value: number;
  label: string;
  tone?: 'brand' | 'success';
  className?: string;
}

export function ProgressBar({ value, label, tone = 'brand', className }: ProgressBarProps) {
  const clamped = Number.isFinite(value) ? Math.max(0, Math.min(100, Math.round(value))) : 0;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn('h-2 w-full overflow-hidden rounded-full bg-surface-raised', className)}
    >
      <div
        className={cn('h-full rounded-full transition-[width] duration-500', tone === 'success' ? 'bg-success' : 'bg-gradient-brand')}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
