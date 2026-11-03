import { describe, expect, it, vi } from 'vitest';
import { createIrisEmailClient } from './iris-email';

describe('Iris transactional email client', () => {
  it('sends only the registered template payload with scoped auth and deterministic idempotency', async () => {
    const requests: Array<{ url: string; init: RequestInit }> = [];
    const fetchImpl: typeof fetch = async (input, init = {}) => {
      requests.push({ url: String(input), init });
      return new Response(JSON.stringify({ status: 'accepted' }), { status: 202 });
    };
    const send = createIrisEmailClient({
      apiUrl: 'https://iris.example.test',
      apiKey: 'test-only-key',
      fetchImpl,
    });
    const email = {
      templateId: 'auth.recovery' as const,
      recipient: 'user@example.test',
      actionUrl: 'https://gencv.meowlabs.id/reset-password/opaque-test-token',
    };

    await send(email);
    await send(email);

    expect(requests).toHaveLength(2);
    expect(requests[0].url).toBe('https://iris.example.test/api/v1/integrations/email');
    expect(requests[0].init.method).toBe('POST');
    expect(new Headers(requests[0].init.headers).get('authorization')).toBe('Bearer test-only-key');
    expect(new Headers(requests[0].init.headers).get('idempotency-key')).toMatch(/^gencv-[a-f0-9]{64}$/);
    expect(new Headers(requests[0].init.headers).get('idempotency-key')).toBe(
      new Headers(requests[1].init.headers).get('idempotency-key'),
    );
    expect(JSON.parse(String(requests[0].init.body))).toEqual({
      template_id: email.templateId,
      recipient: email.recipient,
      action_url: email.actionUrl,
    });
  });

  it('rejects action URLs outside the GenCV origin without a provider request', async () => {
    const fetchImpl = vi.fn<typeof fetch>();
    const send = createIrisEmailClient({
      apiUrl: 'https://iris.example.test',
      apiKey: 'test-only-key',
      fetchImpl,
    });

    await expect(
      send({
        templateId: 'auth.verify',
        recipient: 'user@example.test',
        actionUrl: 'https://evil.example/reset?token=opaque-test-token',
      }),
    ).rejects.toThrow();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('does not expose provider response content when API rejects a request', async () => {
    const fetchImpl: typeof fetch = async () =>
      new Response('test-only-secret-response', { status: 401 });
    const send = createIrisEmailClient({
      apiUrl: 'https://iris.example.test',
      apiKey: 'test-only-key',
      fetchImpl,
    });

    const error = await send({
      templateId: 'auth.verify',
      recipient: 'user@example.test',
      actionUrl: 'https://gencv.meowlabs.id/verify-email/opaque-test-token',
    }).then(() => null, (reason: unknown) => reason as Error);
    expect(error).toBeInstanceOf(Error);
    expect(error?.message).toMatch(/HTTP 401/);
    expect(error?.message).not.toContain('test-only-secret-response');
  });
});
