import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, symlinkSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  analyzeParsed,
  classify,
  extractHttpCodes,
  formatLines,
  runDiagnosis,
  CATEGORIES,
} from './diagnose-claude-failure.mjs';

const SCRIPT = fileURLToPath(new URL('./diagnose-claude-failure.mjs', import.meta.url));

// Synthetic secrets. None of these must ever reach the script output.
const FAKE_OAUTH = 'sk-ant-oat01-FAKEFAKEFAKEFAKEFAKEFAKEFAKEFAKEFAKEFAKEFAKE-AAAA';
const FAKE_APIKEY = 'sk-ant-api03-DEADBEEFDEADBEEFDEADBEEFDEADBEEF';
const FAKE_BEARER = 'Bearer ghs_FAKE0000FAKE0000FAKE0000FAKE0000FAKE';
const FAKE_ACCOUNT = 'account_id=acct_01FAKE2345SYNTHETIC';

function tempDir(t) {
  const dir = mkdtempSync(join(tmpdir(), 'hielya-diag-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

/** Write a synthetic claude-execution-output.json array into `dir`. */
function writeExec(dir, messages, name = 'claude-execution-output.json') {
  const file = join(dir, name);
  writeFileSync(file, JSON.stringify(messages, null, 2));
  return file;
}

function resultMsg(fields) {
  return [
    { type: 'system', subtype: 'init', message: 'Claude Code initialized', model: 'claude-sonnet-5' },
    { type: 'result', subtype: 'success', num_turns: 1, total_cost_usd: 0, modelUsage: {}, ...fields },
  ];
}

// --------------------------------------------------------------------------
// classify() — one fixed category per known signature
// --------------------------------------------------------------------------

test('classify: authentication signature', () => {
  assert.equal(classify('{"type":"authentication_error","message":"invalid x-api-key"}'), 'AUTHENTICATION');
  assert.equal(classify('OAuth token has expired; please run claude setup-token'), 'AUTHENTICATION');
});

test('classify: permission signature', () => {
  assert.equal(classify('permission_error: your credentials do not have permission'), 'PERMISSION');
  assert.equal(classify('Request forbidden by administrative rules'), 'PERMISSION');
});

test('classify: rate limit signature', () => {
  assert.equal(classify('rate_limit_error: number of requests has exceeded your rate limit'), 'RATE_LIMIT');
});

test('classify: service unavailable signature', () => {
  assert.equal(classify('overloaded_error: the service is temporarily unavailable'), 'SERVICE_UNAVAILABLE');
});

test('classify: model / request signature', () => {
  assert.equal(classify('invalid_request_error: max_tokens: prompt is too long'), 'MODEL_OR_REQUEST');
});

test('classify: SDK / configuration signature', () => {
  assert.equal(classify('SDK execution error ... keyword:"dependencies" ... exited with code 1'), 'SDK_OR_CONFIGURATION');
});

test('classify: no evidence yields UNKNOWN', () => {
  assert.equal(classify(''), 'UNKNOWN');
  assert.equal(classify('something happened'), 'UNKNOWN');
  assert.equal(classify(null), 'UNKNOWN');
});

test('classify: bare numbers alone do not force a category', () => {
  // "500" as a token count must NOT be read as a 5xx status here.
  assert.equal(classify('completed 500 iterations over 404 items'), 'UNKNOWN');
});

// --------------------------------------------------------------------------
// extractHttpCodes()
// --------------------------------------------------------------------------

test('extractHttpCodes: pulls 4xx/5xx after status/http/code tokens', () => {
  assert.deepEqual(extractHttpCodes('HttpError: status 401 unauthorized'), [401]);
  assert.deepEqual(extractHttpCodes('{"status":429}'), [429]);
  assert.deepEqual(extractHttpCodes('code: 503 and later status=500'), [500, 503]);
});

test('extractHttpCodes: ignores unrelated numbers', () => {
  assert.deepEqual(extractHttpCodes('processed 404 files in 500 ms'), []);
  assert.deepEqual(extractHttpCodes(''), []);
});

// --------------------------------------------------------------------------
// analyzeParsed() — whitelist shape + code fallback
// --------------------------------------------------------------------------

test('analyzeParsed: authentication result, is_error passthrough', () => {
  const out = analyzeParsed(resultMsg({ is_error: true, result: 'authentication_error: invalid x-api-key' }));
  assert.equal(out.diagnosis_status, 'OK');
  assert.equal(out.is_error, true);
  assert.equal(out.error_category, 'AUTHENTICATION');
});

test('analyzeParsed: HTTP code drives category only when keywords are absent', () => {
  const out = analyzeParsed(resultMsg({ is_error: true, error: { message: 'unexpected failure', type: 'x' }, errors: ['HTTP status 403'] }));
  assert.equal(out.error_category, 'PERMISSION');
  assert.deepEqual(out.http_status_codes, [403]);
});

test('analyzeParsed: no result message -> RESULT_NOT_FOUND, UNKNOWN', () => {
  const out = analyzeParsed([{ type: 'system', subtype: 'init' }]);
  assert.equal(out.diagnosis_status, 'RESULT_NOT_FOUND');
  assert.equal(out.error_category, 'UNKNOWN');
  assert.ok(!('is_error' in out));
});

test('analyzeParsed: is_error omitted when not boolean', () => {
  const out = analyzeParsed(resultMsg({ result: 'rate_limit_error' }));
  assert.ok(!('is_error' in out));
  assert.equal(out.error_category, 'RATE_LIMIT');
});

test('analyzeParsed: only whitelisted keys are ever present', () => {
  // Explicit HTTP context so extractHttpCodes() recognises the code without
  // loosening the parser (it deliberately ignores bare 4xx/5xx numbers).
  const out = analyzeParsed(resultMsg({ is_error: true, result: 'authentication_error: HTTP status 401', session_id: 'sess_secret', uuid: 'u' }));
  assert.deepEqual(Object.keys(out).sort(), ['diagnosis_status', 'error_category', 'http_status_codes', 'is_error'].sort());
});

// --------------------------------------------------------------------------
// runDiagnosis() — file + path validation
// --------------------------------------------------------------------------

test('runDiagnosis: missing env -> EXECUTION_FILE_MISSING / UNKNOWN', () => {
  assert.deepEqual(runDiagnosis({ executionFile: '', runnerTemp: '/tmp' }), {
    diagnosis_status: 'EXECUTION_FILE_MISSING', error_category: 'UNKNOWN',
  });
});

test('runDiagnosis: nonexistent file -> EXECUTION_FILE_MISSING', (t) => {
  const dir = tempDir(t);
  assert.equal(
    runDiagnosis({ executionFile: join(dir, 'nope.json'), runnerTemp: dir }).diagnosis_status,
    'EXECUTION_FILE_MISSING',
  );
});

test('runDiagnosis: invalid JSON -> EXECUTION_FILE_INVALID', (t) => {
  const dir = tempDir(t);
  const file = join(dir, 'claude-execution-output.json');
  writeFileSync(file, 'not json {');
  assert.equal(runDiagnosis({ executionFile: file, runnerTemp: dir }).diagnosis_status, 'EXECUTION_FILE_INVALID');
});

test('runDiagnosis: file outside RUNNER_TEMP -> EXECUTION_FILE_INVALID', (t) => {
  const inside = tempDir(t);
  const outside = tempDir(t);
  const file = writeExec(outside, resultMsg({ is_error: true, result: 'authentication_error' }));
  assert.equal(runDiagnosis({ executionFile: file, runnerTemp: inside }).diagnosis_status, 'EXECUTION_FILE_INVALID');
});

test('runDiagnosis: symlink is rejected -> EXECUTION_FILE_INVALID', (t) => {
  const dir = tempDir(t);
  const real = writeExec(dir, resultMsg({ is_error: true, result: 'authentication_error' }), 'real.json');
  const link = join(dir, 'claude-execution-output.json');
  try {
    symlinkSync(real, link);
  } catch {
    t.skip('symlink not permitted in this environment');
    return;
  }
  assert.equal(runDiagnosis({ executionFile: link, runnerTemp: dir }).diagnosis_status, 'EXECUTION_FILE_INVALID');
});

test('runDiagnosis: oversize file -> EXECUTION_FILE_INVALID', (t) => {
  const dir = tempDir(t);
  const file = writeExec(dir, resultMsg({ is_error: true, result: 'x'.repeat(2048) }));
  assert.equal(runDiagnosis({ executionFile: file, runnerTemp: dir, maxBytes: 512 }).diagnosis_status, 'EXECUTION_FILE_INVALID');
});

test('runDiagnosis: valid authentication file -> OK / AUTHENTICATION', (t) => {
  const dir = tempDir(t);
  const file = writeExec(dir, resultMsg({ is_error: true, result: 'authentication_error: invalid x-api-key (status 401)' }));
  const out = runDiagnosis({ executionFile: file, runnerTemp: dir });
  assert.equal(out.diagnosis_status, 'OK');
  assert.equal(out.is_error, true);
  assert.equal(out.error_category, 'AUTHENTICATION');
  assert.deepEqual(out.http_status_codes, [401]);
});

// --------------------------------------------------------------------------
// Redaction — synthetic credentials must NOT reach stdout / outputs
// --------------------------------------------------------------------------

function runCli(dir, file) {
  const outFile = join(dir, 'gh_output');
  const sumFile = join(dir, 'gh_summary');
  writeFileSync(outFile, '');
  writeFileSync(sumFile, '');
  const stdout = execFileSync(process.execPath, [SCRIPT], {
    env: {
      ...process.env,
      CLAUDE_EXECUTION_FILE: file,
      RUNNER_TEMP: dir,
      GITHUB_OUTPUT: outFile,
      GITHUB_STEP_SUMMARY: sumFile,
      MAX_EXECUTION_FILE_BYTES: '5242880',
    },
    encoding: 'utf8',
  });
  return { stdout, output: readFileSync(outFile, 'utf8'), summary: readFileSync(sumFile, 'utf8') };
}

test('CLI: credentials in the execution file never reach any output channel', (t) => {
  const dir = tempDir(t);
  const messages = resultMsg({
    is_error: true,
    result: `authentication_error: invalid bearer token (HTTP status 401). ${FAKE_BEARER} ${FAKE_OAUTH} ${FAKE_APIKEY} ${FAKE_ACCOUNT}`,
    error: { message: `x-api-key ${FAKE_APIKEY} rejected`, type: 'authentication_error' },
    errors: [`token ${FAKE_OAUTH} expired`, 'https://api.anthropic.com/v1/messages returned 401'],
  });
  const file = writeExec(dir, messages);
  const { stdout, output, summary } = runCli(dir, file);

  for (const channel of [stdout, output, summary]) {
    for (const secret of [FAKE_OAUTH, FAKE_APIKEY, FAKE_BEARER, FAKE_ACCOUNT, 'api.anthropic.com', 'v1/messages']) {
      assert.ok(!channel.includes(secret), `leaked \`${secret}\` into: ${channel}`);
    }
  }
  // Only whitelisted keys.
  const keys = stdout.trim().split('\n').map((l) => l.split('=')[0]).sort();
  assert.deepEqual(keys, ['diagnosis_status', 'error_category', 'http_status_codes', 'is_error'].sort());
  assert.match(stdout, /error_category=AUTHENTICATION/);
  assert.match(stdout, /diagnosis_status=OK/);
  assert.match(stdout, /is_error=true/);
});

test('CLI: unknown failure still emits only fixed fields', (t) => {
  const dir = tempDir(t);
  const file = writeExec(dir, resultMsg({ is_error: true, result: 'the sky turned green' }));
  const { stdout } = runCli(dir, file);
  assert.match(stdout, /^diagnosis_status=OK$/m);
  assert.match(stdout, /^error_category=UNKNOWN$/m);
  assert.doesNotMatch(stdout, /sky|green/);
});

test('CLI: missing execution file exits 0 with fixed code', (t) => {
  const dir = tempDir(t);
  const stdout = execFileSync(process.execPath, [SCRIPT], {
    env: { ...process.env, CLAUDE_EXECUTION_FILE: '', RUNNER_TEMP: dir, GITHUB_OUTPUT: '', GITHUB_STEP_SUMMARY: '' },
    encoding: 'utf8',
  });
  assert.match(stdout, /diagnosis_status=EXECUTION_FILE_MISSING/);
  assert.match(stdout, /error_category=UNKNOWN/);
});

// --------------------------------------------------------------------------
// formatLines() contract
// --------------------------------------------------------------------------

test('formatLines: omits is_error and http_status_codes when absent', () => {
  assert.deepEqual(formatLines({ diagnosis_status: 'RESULT_NOT_FOUND', error_category: 'UNKNOWN' }), [
    'diagnosis_status=RESULT_NOT_FOUND',
    'error_category=UNKNOWN',
  ]);
});

test('formatLines: coerces an unexpected category to UNKNOWN', () => {
  const lines = formatLines({ diagnosis_status: 'OK', error_category: 'TOTALLY_MADE_UP' });
  assert.ok(lines.includes('error_category=UNKNOWN'));
});

test('CATEGORIES is the closed set from the task spec', () => {
  assert.deepEqual([...CATEGORIES], [
    'AUTHENTICATION', 'PERMISSION', 'RATE_LIMIT', 'MODEL_OR_REQUEST',
    'SERVICE_UNAVAILABLE', 'SDK_OR_CONFIGURATION', 'UNKNOWN',
  ]);
});
