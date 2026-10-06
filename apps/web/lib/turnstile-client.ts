'use client';

/**
 * Invisible Cloudflare Turnstile challenge, used only when NEXT_PUBLIC_TURNSTILE_SITE_KEY is set.
 * Each token is single-use, so one is fetched per AI request.
 */

interface TurnstileApi {
  render(container: HTMLElement, options: Record<string, unknown>): string;
  execute(widgetId: string): void;
  reset(widgetId: string): void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

let scriptPromise: Promise<TurnstileApi> | null = null;

function loadScript(): Promise<TurnstileApi> {
  scriptPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error('Turnstile unavailable')));
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error('Turnstile unavailable'));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export async function getTurnstileToken(): Promise<string | null> {
  if (!SITE_KEY) return null;
  const turnstile = await loadScript();
  const container = document.createElement('div');
  container.hidden = true;
  document.body.appendChild(container);
  try {
    return await new Promise<string>((resolve, reject) => {
      const widgetId = turnstile.render(container, {
        sitekey: SITE_KEY,
        execution: 'execute',
        appearance: 'interaction-only',
        callback: resolve,
        'error-callback': () => reject(new Error('Turnstile failed')),
        'timeout-callback': () => reject(new Error('Turnstile timed out')),
      });
      turnstile.execute(widgetId);
    });
  } finally {
    container.remove();
  }
}
