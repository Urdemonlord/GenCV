import { describe, expect, it } from 'vitest';
import { validateEmail, validatePhone } from './validation';

describe('validation', () => {
  it('checks email shape', () => {
    expect(validateEmail('rina@example.com')).toBe(true);
    expect(validateEmail('rina@example')).toBe(false);
    expect(validateEmail('rina example@x.com')).toBe(false);
  });

  it('accepts international and local phone formats', () => {
    expect(validatePhone('+62 812-3456-7890')).toBe(true);
    expect(validatePhone('0812-3456-7890')).toBe(true);
    expect(validatePhone('(021) 555 1234')).toBe(true);
    expect(validatePhone('+0 812')).toBe(false);
    expect(validatePhone('+1234567890123456')).toBe(false);
    expect(validatePhone('call me')).toBe(false);
  });
});
