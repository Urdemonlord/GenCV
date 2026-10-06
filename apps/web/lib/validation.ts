export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Accepts international ("+62 812-3456-7890") and local ("0812-3456-7890", "07700 900123")
 * formats. International numbers follow E.164 length (max 15 digits incl. country code).
 * Deliberately not libphonenumber-js: its metadata adds ~30 kB gzip to every page using this.
 */
export function validatePhone(phone: string): boolean {
  const value = phone.trim();
  const digits = value.replace(/[\s\-().\/]/g, '');
  return value.startsWith('+') ? /^\+[1-9]\d{7,14}$/.test(digits) : /^\d{6,15}$/.test(digits);
}
