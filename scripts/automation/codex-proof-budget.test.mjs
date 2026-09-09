import assert from 'node:assert/strict';
import test from 'node:test';
import { CodexProofBudget } from './codex-proof-budget.mjs';

const request = (overrides = {}) => ({
  requestId: 'probe-1', model: 'gpt-5.6-sol', inputTokens: 1000,
  maxOutputTokens: 1024, ...overrides,
});

test('reserves worst-case input plus full output before any transport', () => {
  const budget = new CodexProofBudget();
  assert.deepEqual(budget.reserve(request()), { status: 'RESERVED', reserved_micro_usd: 25480 });
  assert.equal(budget.snapshot().remaining_micro_usd, 774520);
});

test('exact ceiling is accepted and another request is denied', () => {
  const budget = new CodexProofBudget();
  assert.equal(budget.reserve(request({ inputTokens: 159996, maxOutputTokens: 1 })).status, 'RESERVED');
  assert.equal(budget.snapshot().remaining_micro_usd, 0);
  assert.deepEqual(budget.reserve(request({ requestId: 'probe-2' })), { status: 'BLOCKED', reason: 'BUDGET_LIMIT' });
  assert.equal(budget.snapshot().reserved_micro_usd, 800000);
});

test('one input token beyond the ceiling is rejected without reservation', () => {
  const budget = new CodexProofBudget();
  assert.equal(budget.reserve(request({ inputTokens: 159997, maxOutputTokens: 1 })).reason, 'BUDGET_LIMIT');
  assert.equal(budget.snapshot().requests_reserved, 0);
});

test('same identity cannot be retried and permanently closes the proof', () => {
  const budget = new CodexProofBudget();
  budget.reserve(request());
  assert.equal(budget.reserve(request()).reason, 'RETRY_FORBIDDEN');
  assert.equal(budget.reserve(request({ requestId: 'probe-2' })).reason, 'CLOSED');
});

test('abort after a lost response retains the whole reservation', () => {
  const budget = new CodexProofBudget();
  budget.reserve(request());
  budget.abort();
  assert.equal(budget.snapshot().reserved_micro_usd, 25480);
  assert.equal(budget.reserve(request({ requestId: 'probe-2' })).reason, 'CLOSED');
});

test('bounded parallel callers cannot overspend synchronous reservation', async () => {
  const budget = new CodexProofBudget();
  const results = await Promise.all(Array.from({ length: 8 }, (_, i) => Promise.resolve().then(
    () => budget.reserve(request({ requestId: `probe-${i + 1}`, inputTokens: 40000 })),
  )));
  assert.equal(results.filter((r) => r.status === 'RESERVED').length, 3);
  assert.equal(budget.snapshot().reserved_micro_usd, 661440);
  assert.equal(budget.snapshot().status, 'CLOSED');
});

test('eight small requests consume eight slots; a ninth identity is rejected', () => {
  const budget = new CodexProofBudget();
  for (let i = 1; i <= 8; i += 1) assert.equal(budget.reserve(request({ requestId: `probe-${i}` })).status, 'RESERVED');
  assert.equal(budget.snapshot().requests_reserved, 8);
  assert.equal(budget.reserve(request({ requestId: 'probe-9' })).status, 'BLOCKED');
});

test('invalid counts, model, and output bounds fail closed', () => {
  const cases = [
    { inputTokens: -1 }, { inputTokens: 0.5 }, { inputTokens: NaN },
    { inputTokens: Infinity }, { inputTokens: '1000' },
    { inputTokens: Number.MAX_SAFE_INTEGER + 1 },
    { maxOutputTokens: 0 }, { maxOutputTokens: 1025 },
    { model: 'other-model' }, { requestId: 'untrusted' },
  ];
  for (const overrides of cases) {
    const budget = new CodexProofBudget();
    assert.equal(budget.reserve(request(overrides)).reason, 'INVALID_REQUEST');
    assert.equal(budget.snapshot().reserved_micro_usd, 0);
    assert.equal(budget.reserve(request()).reason, 'CLOSED');
  }
});

test('safe integer near overflow cannot wrap the cost calculation', () => {
  const budget = new CodexProofBudget();
  assert.equal(budget.reserve(request({ inputTokens: Number.MAX_SAFE_INTEGER })).reason, 'BUDGET_LIMIT');
});

test('returned snapshots cannot change the internal reservation', () => {
  const budget = new CodexProofBudget();
  const snapshot = budget.snapshot();
  snapshot.remaining_micro_usd = Number.MAX_SAFE_INTEGER;
  assert.equal(budget.snapshot().remaining_micro_usd, 800000);
});

test('synthetic secret is not copied into structured diagnostics', () => {
  const secret = 'SYNTHETIC_PRIVATE_VALUE_DO_NOT_EMIT';
  const budget = new CodexProofBudget();
  const result = budget.reserve(request({ requestId: secret, payload: secret }));
  assert.equal(JSON.stringify([result, budget.snapshot()]).includes(secret), false);
  assert.deepEqual(Object.keys(result).sort(), ['reason', 'status']);
  assert.deepEqual(Object.keys(budget.snapshot()).sort(), ['remaining_micro_usd', 'requests_reserved', 'reserved_micro_usd', 'status']);
});
