'use client';

import { useState } from 'react';

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
  const match = value.match(/^(\d{4})(?:-(\d{2}))?$/);
  const year = match?.[1] ?? '';
  // A month picked before the year has nowhere to live in "YYYY-MM", so hold it locally.
  const [pendingMonth, setPendingMonth] = useState('');
  const month = match ? match[2] ?? '' : pendingMonth;

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 66 }, (_, index) => String(currentYear + 6 - index));
  if (year && !years.includes(year)) years.push(year);

  const emit = (nextYear: string, nextMonth: string) => {
    onChange(nextYear ? (nextMonth ? `${nextYear}-${nextMonth}` : nextYear) : '');
  };

  return (
    <div className="space-y-1">
      <div className="flex gap-2">
        <select
          aria-label={`${label} month`}
          className={selectClass}
          value={month}
          disabled={disabled}
          onChange={(event) => {
            if (year) emit(year, event.target.value);
            else setPendingMonth(event.target.value);
          }}
        >
          <option value="">Month</option>
          {MONTHS.map((name, index) => (
            <option key={name} value={String(index + 1).padStart(2, '0')}>
              {name}
            </option>
          ))}
        </select>
        <select
          aria-label={`${label} year`}
          className={selectClass}
          value={year}
          disabled={disabled}
          onChange={(event) => {
            emit(event.target.value, month);
            setPendingMonth('');
          }}
        >
          <option value="">Year</option>
          {years.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
      {value && !match && (
        <p className="text-xs text-warning">Saved as “{value}”. Pick a month and year to standardise it.</p>
      )}
    </div>
  );
}
