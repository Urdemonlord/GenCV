import type { AiInput, AiLanguage, AiOutput, AiTask } from '@/lib/ai/tasks';
import type { CV } from '@/lib/cv/schema';
import { getTurnstileToken } from '@/lib/turnstile-client';

export class AiError extends Error {}

/** Output language for AI suggestions, following the CV's own language and region. */
export function aiLanguageFor(cv: CV): AiLanguage {
  return cv.settings.language === 'id' ? 'id' : 'en-US';
}

/** Target role for prompts: the headline, else the most recent position. */
export function aiRoleFor(cv: CV): string {
  return cv.personalInfo.headline.trim() || cv.experience.find((e) => e.position.trim())?.position.trim() || '';
}

/** Shared prompt context taken from the CV. */
export function aiContext(cv: CV) {
  return {
    language: aiLanguageFor(cv),
    role: aiRoleFor(cv),
    level: cv.experienceLevel,
    confirmedKeywords: cv.confirmedKeywords,
  };
}

/** Calls the app's own `/api/ai` route; CV text is never sent anywhere else. */
export async function requestAi<T extends AiTask>(task: T, input: AiInput<T>): Promise<AiOutput<T>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  try {
    const token = await getTurnstileToken();
    if (token) headers['x-turnstile-token'] = token;
  } catch {
    throw new AiError('Verifikasi keamanan gagal dimuat. Periksa koneksi lalu coba lagi.');
  }

  let response: Response;
  try {
    response = await fetch('/api/ai', { method: 'POST', headers, body: JSON.stringify({ task, input }) });
  } catch {
    throw new AiError('Tidak bisa terhubung ke layanan AI. Periksa koneksi internet kamu.');
  }
  const result = await response.json().catch(() => null);
  if (!response.ok || !result?.success || typeof result.data !== 'object') {
    throw new AiError(result?.error || 'Layanan AI sedang tidak tersedia.');
  }
  return result.data as AiOutput<T>;
}
