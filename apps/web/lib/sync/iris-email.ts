import { createHash } from 'node:crypto';
import process from 'node:process';

export type IrisTemplateId = 'auth.verify' | 'auth.recovery';

export interface IrisEmail {
  templateId: IrisTemplateId;
  recipient: string;
  actionUrl: string;
}

interface IrisEmailClientConfig {
  apiUrl: string;
  apiKey: string;
  fetchImpl?: typeof fetch;
}

const TEMPLATE_IDS = new Set<IrisTemplateId>(['auth.verify', 'auth.recovery']);
const ACTION_ORIGIN = 'https://gencv.meowlabs.id';

export function createIrisEmailClient({
  apiUrl,
  apiKey,
  fetchImpl = fetch,
}: IrisEmailClientConfig): (email: IrisEmail) => Promise<void> {
  return async (email) => {
    if (!apiKey || apiKey.trim() !== apiKey || [...apiKey].some((char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127)) {
      throw new Error('Iris email credentials are not configured');
    }

    let endpoint: URL;
    try {
      const base = new URL(apiUrl);
      if (
        base.protocol !== 'https:' ||
        base.username ||
        base.password ||
        base.pathname !== '/' ||
        base.search ||
        base.hash
      ) {
        throw new Error('invalid base URL');
      }
      endpoint = new URL('/api/v1/integrations/email', base);
    } catch {
      throw new Error('Iris email API URL is invalid');
    }

    if (!TEMPLATE_IDS.has(email.templateId)) {
      throw new Error('Iris email template is not allowed');
    }
    if (
      !email.recipient ||
      email.recipient.trim() !== email.recipient ||
      email.recipient.length > 254 ||
      [...email.recipient].some((char) => char.charCodeAt(0) <= 32 || char.charCodeAt(0) === 127 || char === '<' || char === '>') ||
      email.recipient.split('@').length !== 2
    ) {
      throw new Error('Iris email recipient is invalid');
    }

    let actionUrl: URL;
    try {
      actionUrl = new URL(email.actionUrl);
    } catch {
      throw new Error('Iris email action URL is invalid');
    }
    if (
      actionUrl.origin !== ACTION_ORIGIN ||
      actionUrl.username ||
      actionUrl.password
    ) {
      throw new Error('Iris email action URL is invalid');
    }

    const digest = createHash('sha256')
      .update(
        [email.templateId, email.recipient, email.actionUrl]
          .map((value) => `${value.length}:${value}`)
          .join(''),
      )
      .digest('hex');
    const idempotencyKey = `gencv-${digest}`;
    const response = await fetchImpl(endpoint, {
      method: 'POST',
      redirect: 'error',
      signal: AbortSignal.timeout(10_000),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({
        template_id: email.templateId,
        recipient: email.recipient,
        action_url: email.actionUrl,
      }),
    });
    if (!response.ok) {
      throw new Error(`Iris email API returned HTTP ${response.status}`);
    }
  };
}

export async function sendIrisAuthEmail(email: IrisEmail): Promise<void> {
  const apiUrl = process.env.IRIS_EMAIL_API_URL;
  const apiKey = process.env.IRIS_EMAIL_API_KEY;
  if (!apiUrl || !apiKey) {
    throw new Error('Iris email credentials are not configured');
  }
  await createIrisEmailClient({ apiUrl, apiKey })(email);
}
