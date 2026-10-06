import { getApiUrl } from '@/lib/api-url';

export class AiError extends Error {}

/** Calls the server AI route and returns its text, throwing a readable error otherwise. */
export async function requestAi(body: Record<string, unknown>): Promise<string> {
  let response: Response;
  try {
    response = await fetch(`${getApiUrl()}/api/ai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new AiError('Tidak bisa terhubung ke layanan AI. Periksa koneksi internet kamu.');
  }
  const result = await response.json().catch(() => null);
  if (response.status === 429) throw new AiError('Terlalu banyak permintaan. Coba lagi sebentar lagi.');
  if (!response.ok || !result?.success || typeof result.data !== 'string') {
    throw new AiError(result?.error || 'Layanan AI sedang tidak tersedia.');
  }
  return result.data;
}
