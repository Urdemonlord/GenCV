import { useId } from 'react';
import { cn } from '@/lib/cn';

interface ScoreRingProps {
  value: number;
  size?: number;
  label: string;
  caption?: string;
  className?: string;
}

/** Circular 0–100 score. Callers must pass a value computed from real data. */
export function ScoreRing({ value, size = 96, label, caption, className }: ScoreRingProps) {
  const gradientId = useId();
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const stroke = Math.max(6, size / 12);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="hsl(var(--success))" />
            <stop offset="100%" stopColor="hsl(var(--primary))" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--surface-raised))" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped / 100)}
          className="transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <span className="absolute flex flex-col items-center leading-none">
        <span className="font-bold text-foreground" style={{ fontSize: size * 0.3 }}>
          {clamped}
        </span>
        {caption && <span className="mt-1 text-[10px] text-muted-foreground">{caption}</span>}
      </span>
    </div>
  );
}
