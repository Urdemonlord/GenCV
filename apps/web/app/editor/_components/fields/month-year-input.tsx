'use client';

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

const selectClass =
  'h-10 min-w-0 flex-1 rounded-lg border border-input bg-background/60 px-2 text-sm disabled:cursor-not-allowed disabled:opacity-50';

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
  const match = value.match(/^(\d{4})(?:-(0[1-9]|1[0-2]))?$/);
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
          aria-label={`${label}, tahun`}
          className={selectClass}
          value={year}
          disabled={disabled}
          onChange={(event) => {
            const nextYear = event.target.value;
            onChange(nextYear ? (month ? `${nextYear}-${month}` : nextYear) : '');
          }}
        >
          <option value="">Tahun</option>
          {years.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <select
          aria-label={`${label}, bulan`}
          className={selectClass}
          value={month}
          disabled={disabled || !year}
          onChange={(event) => onChange(event.target.value ? `${year}-${event.target.value}` : year)}
        >
          <option value="">Bulan</option>
          {MONTHS.map((name, index) => (
            <option key={name} value={String(index + 1).padStart(2, '0')}>
              {name}
            </option>
          ))}
        </select>
      </div>
      {value && !match && (
        <p className="text-xs text-warning">Tersimpan sebagai “{value}”. Pilih tahun dan bulan agar formatnya standar.</p>
      )}
    </div>
  );
}
