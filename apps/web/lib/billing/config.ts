import { isSyncConfigured } from '@/lib/sync/config';

/**
 * Credit sales need accounts (the sync database and Better Auth) and a MeowPay panel key.
 * Without all of them, AI stays free under the per-IP limits and the credit routes answer 503.
 */
export function isBillingConfigured(): boolean {
  return Boolean(
    isSyncConfigured() &&
      process.env.MEOWPAY_HOST?.trim() &&
      process.env.MEOWPAY_KEY?.trim() &&
      process.env.MEOWPAY_WEBHOOK_SECRET?.trim(),
  );
}
