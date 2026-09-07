import { describe, expect, it, vi } from 'vitest';
import { AuthFailure, createAuthFlow, createMemorySessionStore, type OtpTransportPort, type VerificationResponse } from '../../packages/application/src/client-auth';
// Synthetic fixtures only. Never record actual OTP/session values in test diagnostics or telemetry.
const phone = '612345678';
const challenge = { challengeId: '11111111-1111-4111-8111-111111111111', expiresInSeconds: 300, resendAfterSeconds: 60 };
const verified: VerificationResponse = { sessionToken: 'x'.repeat(43), expiresInSeconds: 2592000, customer: { id: '22222222-2222-4222-8222-222222222222', phoneE164: `+34${phone}`, phoneVerifiedAt: '2026-09-07T00:00:00Z', status: 'ACTIVE' } };
function setup() {
  let now = 1000000;
  const sessions = createMemorySessionStore(() => now);
  const transport = { request: vi.fn<OtpTransportPort['request']>().mockResolvedValue(challenge), verify: vi.fn<OtpTransportPort['verify']>().mockResolvedValue(verified) };
  const flow = createAuthFlow(transport, sessions, () => now);
  return { sessions, transport, flow, advance: (ms: number) => { now += ms; flow.tick(); } };
}
async function entered() { const result = setup(); result.flow.setPhone(phone); await result.flow.request(); return result; }
describe('application-owned OTP flow', () => {
  it('starts without requests and validates phone before transport', async () => {
    const { flow, transport } = setup(); await flow.request();
    expect(transport.request).not.toHaveBeenCalled(); expect(flow.getSnapshot().requestError).toBe('phone');
  });
  it('requests normalized Spanish phone and exposes only masked phone/challenge generation to OTP presentation', async () => {
    const { flow, transport } = await entered();
    expect(transport.request).toHaveBeenCalledOnce(); expect(flow.getSnapshot()).toMatchObject({ screen: 'otp', maskedPhone: '+34 ******678', expiresSeconds: 300, resendSeconds: 60, challengeVersion: 1 });
    expect('challengeId' in flow.getSnapshot()).toBe(false); expect('code' in flow.getSnapshot()).toBe(false);
  });
  it('deduplicates request synchronously and blocks phone mutation in flight', async () => {
    const { flow, transport } = setup(); flow.setPhone(phone);
    const a = flow.request(); flow.setPhone('111111111'); const b = flow.request(); await Promise.all([a,b]);
    expect(transport.request).toHaveBeenCalledOnce(); expect(flow.getSnapshot().nationalDigits).toBe(phone);
  });
  it('derives timers from deadlines and never automatically resends or marks server expiry', async () => {
    const { flow, transport, advance } = await entered(); advance(301000);
    expect(flow.getSnapshot()).toMatchObject({ expiresSeconds: 0, resendSeconds: 0, resendBlocked: false, verification: 'idle' });
    expect(transport.request).toHaveBeenCalledOnce();
  });
  it('resends only explicitly after cooldown and advances challenge generation', async () => {
    const { flow, transport, advance } = await entered(); await flow.request(); expect(transport.request).toHaveBeenCalledOnce();
    advance(60000); await flow.request(); expect(transport.request).toHaveBeenCalledTimes(2); expect(flow.getSnapshot().challengeVersion).toBe(2);
  });
  it('preserves known cooldown through change-number and return to the same phone', async () => {
    const { flow, transport } = await entered(); flow.changeNumber(); flow.setPhone('611111111'); flow.setPhone(phone); await flow.request();
    expect(flow.getSnapshot().resendBlocked).toBe(true); expect(transport.request).toHaveBeenCalledOnce();
  });
  it('deduplicates completion and consumes one session outside the presentation snapshot', async () => {
    const { flow, transport, sessions } = await entered(); await Promise.all([flow.verify('123456'), flow.verify('123456')]);
    expect(transport.verify).toHaveBeenCalledOnce(); expect(Boolean(sessions.read())).toBe(true);
    expect(flow.getSnapshot()).toMatchObject({ screen: 'success', nationalDigits: '', maskedPhone: '' }); expect('sessionToken' in flow.getSnapshot()).toBe(false);
  });
  it('allows explicit same-code retry after uncertain network failure, then treats unavailable as terminal', async () => {
    const { flow, transport, sessions } = await entered(); transport.verify.mockRejectedValueOnce(new AuthFailure('NETWORK')).mockRejectedValueOnce(new AuthFailure('OTP_UNAVAILABLE'));
    await flow.verify('123456'); expect(flow.getSnapshot().verification).toBe('network-error');
    await flow.verify('123456'); expect(transport.verify).toHaveBeenCalledOnce();
    await flow.retry(); expect(transport.verify).toHaveBeenCalledTimes(2); expect(flow.getSnapshot().verification).toBe('unavailable');
    await flow.retry(); await flow.verify('654321'); expect(transport.verify).toHaveBeenCalledTimes(2); expect(sessions.read()).toBeUndefined();
  });
  it.each([['OTP_INVALID','invalid'],['OTP_EXPIRED','expired'],['OTP_LOCKED','locked'],['SERVICE','service-unavailable']] as const)('maps %s without false success', async (code, state) => {
    const { flow, transport, sessions } = await entered(); transport.verify.mockRejectedValue(new AuthFailure(code, 120)); await flow.verify('123456');
    expect(flow.getSnapshot().verification).toBe(state); expect(sessions.read()).toBeUndefined();
  });
  it('allows the same code on a fresh attempt after invalid result', async () => {
    const { flow, transport } = await entered(); transport.verify.mockRejectedValueOnce(new AuthFailure('OTP_INVALID')); await flow.verify('123456'); await flow.verify('123456');
    expect(transport.verify).toHaveBeenCalledTimes(2); expect(flow.getSnapshot().screen).toBe('success');
  });
  it('honors Retry-After even when old resend countdown finished', async () => {
    const { flow, transport, advance } = await entered(); advance(60000); transport.request.mockRejectedValueOnce(new AuthFailure('OTP_RESEND_COOLDOWN', 120)); await flow.request();
    expect(flow.getSnapshot()).toMatchObject({ resendSeconds: 120, resendBlocked: true, requestError: 'cooldown' });
  });
  it('does not invent an unlock interval for a missing Retry-After', async () => {
    const { flow, transport, advance } = await entered(); transport.verify.mockRejectedValueOnce(new AuthFailure('OTP_LOCKED')); await flow.verify('123456'); advance(9999999);
    expect(flow.getSnapshot().resendBlocked).toBe(true);
  });
  it('ignores stale verify success when user changes number', async () => {
    const { flow, transport, sessions } = await entered(); let resolve!: (v: VerificationResponse) => void;
    transport.verify.mockImplementationOnce(() => new Promise(r => { resolve = r; })); const pending = flow.verify('123456'); flow.changeNumber(); resolve(verified); await pending;
    expect(flow.getSnapshot().screen).toBe('phone'); expect(sessions.read()).toBeUndefined();
  });
  it('ignores stale request completion on cancellation', async () => {
    const { flow, transport } = setup(); flow.setPhone(phone); let resolve!: (v: typeof challenge) => void;
    transport.request.mockImplementationOnce(() => new Promise(r => { resolve = r; })); const pending = flow.request(); flow.changeNumber(); resolve(challenge); await pending;
    expect(flow.getSnapshot().screen).toBe('phone'); expect(flow.getSnapshot().challengeVersion).toBe(0);
  });
  it('keeps a challenge after resend delivery failure', async () => {
    const { flow, transport, advance } = await entered(); advance(60000); transport.request.mockRejectedValueOnce(new AuthFailure('SERVICE')); await flow.request();
    expect(flow.getSnapshot()).toMatchObject({ screen: 'otp', challengeVersion: 1, requestError: 'service' });
    await flow.verify('123456'); expect(flow.getSnapshot().screen).toBe('success');
  });
});
describe('memory session integration seam', () => {
  it('is isolated per application, expires absolutely and can be cleared', () => {
    let now = 100; const store = createMemorySessionStore(() => now); const notify = vi.fn(); const unsub = store.subscribe(notify);
    store.write({ ...verified, expiresAt: 200 }); expect(Boolean(store.read())).toBe(true); expect(createMemorySessionStore().read()).toBeUndefined();
    now = 201; expect(store.read()).toBeUndefined(); store.clear(); expect(notify).toHaveBeenCalledTimes(2); unsub();
  });
});
