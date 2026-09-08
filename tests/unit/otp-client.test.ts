import { afterEach, describe, expect, it, vi } from 'vitest';
import { createOtpClient } from '../../apps/ui-lab/src/client/auth/otp-client';
import { AuthFailure } from '../../packages/application/src/client-auth';
const id = '11111111-1111-4111-8111-111111111111';
const signal = () => new AbortController().signal;
const challenge = { challengeId: id, expiresInSeconds: 300, resendAfterSeconds: 60 };
const success = { sessionToken: 'x'.repeat(43), expiresInSeconds: 2592000, customer: { id, phoneE164: '+34612345678', phoneVerifiedAt: '2026-09-07T00:00:00Z', status: 'ACTIVE' } };
afterEach(() => vi.useRealTimers());
describe('OTP HTTP adapter', () => {
  it('uses the exact request contract and disables caching, cookies and redirects', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json(challenge, { status: 202 }));
    await createOtpClient(fetcher).request('+34612345678', signal());
    const [url, options] = fetcher.mock.calls[0];
    expect(url).toBe('/api/v1/auth/otp/request'); expect(options).toMatchObject({ method: 'POST', cache: 'no-store', credentials: 'omit', redirect: 'error' });
    expect(Object.keys(JSON.parse(options!.body as string))).toEqual(['phoneE164','locale']);
  });
  it('uses only challengeId and code for verify and validates the opaque session shape', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json(success));
    const result = await createOtpClient(fetcher).verify(id, '123456', signal());
    expect(Object.keys(JSON.parse(fetcher.mock.calls[0][1]!.body as string))).toEqual(['challengeId','code']);
    expect(result.customer.status).toBe('ACTIVE');
  });
  it.each(['OTP_INVALID','OTP_EXPIRED','OTP_UNAVAILABLE','OTP_LOCKED','OTP_RESEND_COOLDOWN'])('maps safe %s without trusting server text', async code => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ code, message: 'untrusted' }, { status: 429, headers: { 'retry-after': '120' } }));
    await expect(createOtpClient(fetcher).verify(id, '123456', signal())).rejects.toMatchObject({ code, retryAfterSeconds: 120, message: 'Authentication operation failed.' });
  });
  it('rejects malformed success as uncertain, never as authenticated', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ ...success, sessionToken: '' }));
    await expect(createOtpClient(fetcher).verify(id, '123456', signal())).rejects.toMatchObject({ code: 'NETWORK' });
  });
  it('rejects malformed challenge data without entering OTP', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ ...challenge, resendAfterSeconds: -1 }, { status: 202 }));
    await expect(createOtpClient(fetcher).request('+34612345678', signal())).rejects.toMatchObject({ code: 'SERVICE' });
  });
  it('handles lost verify JSON response as network uncertainty', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response('incomplete', { status: 200 }));
    await expect(createOtpClient(fetcher).verify(id, '123456', signal())).rejects.toMatchObject({ code: 'NETWORK' });
  });
  it('rejects invalid outbound input before any fetch', async () => {
    const fetcher = vi.fn<typeof fetch>(); const client = createOtpClient(fetcher);
    await expect(client.request('+44123456789', signal())).rejects.toBeInstanceOf(AuthFailure);
    await expect(client.verify(id, 'abc', signal())).rejects.toBeInstanceOf(AuthFailure); expect(fetcher).not.toHaveBeenCalled();
  });
  it('timeout aborts transport and reports uncertain network outcome', async () => {
    vi.useFakeTimers();
    const fetcher = vi.fn<typeof fetch>().mockImplementation((_url, init) => new Promise((_resolve, reject) => init!.signal!.addEventListener('abort', () => reject(new Error('aborted')))));
    const pending = createOtpClient(fetcher, 100).verify(id, '123456', signal());
    const assertion = expect(pending).rejects.toMatchObject({ code: 'NETWORK' }); await vi.advanceTimersByTimeAsync(100); await assertion;
  });
  it('distinguishes caller cancellation from timeout', async () => {
    const controller = new AbortController();
    const fetcher = vi.fn<typeof fetch>().mockImplementation((_url, init) => new Promise((_resolve, reject) => init!.signal!.addEventListener('abort', () => reject(new Error('aborted')))));
    const pending = createOtpClient(fetcher).verify(id, '123456', controller.signal); controller.abort();
    await expect(pending).rejects.toMatchObject({ code: 'ABORTED' });
  });
});
