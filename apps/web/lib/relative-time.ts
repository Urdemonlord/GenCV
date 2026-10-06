const relativeTime = new Intl.RelativeTimeFormat('id', { numeric: 'auto' });

/** "baru saja", "5 menit yang lalu", "kemarin", … then a plain date after a month. */
export function relativeTimeLabel(timestamp: number, now: number): string {
  const minutes = Math.round((timestamp - now) / 60_000);
  if (minutes === 0) return 'baru saja';
  if (Math.abs(minutes) < 60) return relativeTime.format(minutes, 'minute');
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return relativeTime.format(hours, 'hour');
  const days = Math.round(hours / 24);
  if (Math.abs(days) < 30) return relativeTime.format(days, 'day');
  return new Date(timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}
