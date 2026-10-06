'use client';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const selectClass =
  'h-10 min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-sm disabled:cursor-not-allowed disabled:opacity-50';

interface MonthYearInputProps {
  /** "YYYY-MM", "YYYY" or "" */
  value: string;
  onChange: (value: string) => void;
  label: string;
  disabled?: boolean;
}

/**
 * Month + year selects instead of <input type="month">, which Safari and Firefox
 * desktop render as a plain text box.
 */
export function MonthYearInput({ value, onChange, label, disabled }: MonthYearInputProps) {
  const match = value.match(/^(d{4})(?:-(0[1-9]|1[0-2]))?$/);
  const year = match?.[1] ?? '';
  const month = match?.[2] ?? '';

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 66 }, (_, index) => String(currentYear + 6 - index));
  if (year && !years.includes(year)) years.push(year);

  // Year comes first and the month stays disabled until a year is chosen, so a month can
  // never be picked without somewhere to store it.
  return (
    <div className="space-y-1">
      <div className="flex gap-2">
        <select
          aria-label={}
          className={selectClass}
          value={year}
          disabled={disabled}
          onChange={(event) => {
            const nextYear = event.target.value;
            onChange(nextYear ? (month ?  : nextYear) : '');
          }}
        >
          <option value="">Year</option>
          {years.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <select
          aria-label={}
          className={selectClass}
          value={month}
          disabled={disabled || !year}
          onChange={(event) => onChange(event.target.value ?  : year)}
        >
          <option value="">Month</option>
          {MONTHS.map((name, index) => (
            <option key={name} value={String(index + 1).padStart(2, '0')}>
              {name}
            </option>
          ))}
        </select>
      </div>
      {value && !match && (
        <p className="text-xs text-amber-600">Saved as “{value}”. Pick a month and year to standardise it.</p>
      )}
    </div>
  );
}
