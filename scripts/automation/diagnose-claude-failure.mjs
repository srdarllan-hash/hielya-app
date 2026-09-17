// scripts/automation/diagnose-claude-failure.mjs
//
// Filtered, whitelist-only diagnosis of a FAILED `anthropics/claude-code-action`
// run. It exists so a maintainer can classify the Issue #62 smoke-test failure
// WITHOUT publishing the raw SDK stream (`show_full_output` stays false) and
// WITHOUT changing the authentication method by trial and error.
//
// Input: the action's `execution_file` step output. Verified behaviour of
// anthropics/claude-code-action@v1.0.217 (commit
// 9c5ddab2e6d17b83ea679153b31f1d5f023cf636):
//   - base-action/src/execution-file.ts writes `claude-execution-output.json`
//     into `RUNNER_TEMP` and exposes `getExecutionFilePath()` /
//     `setExecutionFileOutputIfPresent()`.
//   - src/entrypoints/run.ts sets the `execution_file` action output on the
//     success path AND, in its `catch`, via
//     `executionFile ??= setExecutionFileOutputIfPresent()` — so the output is
//     present after an immediate failure as long as the file was written.
//
// This script NEVER prints raw SDK text. The only fields it emits are:
//   diagnosis_status : OK | EXECUTION_FILE_MISSING | EXECUTION_FILE_INVALID
//                      | RESULT_NOT_FOUND | DIAGNOSTIC_ERROR
//   is_error         : true | false            (only when a boolean is found)
//   http_status_codes: comma-separated ints in [400,599]  (only when found)
//   error_category   : one of CATEGORIES (fixed strings)
//   error_type       : a recognized provider error type, when unambiguous
//   evidence_source  : RESULT | SYSTEM | ASSISTANT | MULTIPLE
//   evidence_kind    : INFERRED (category classification, not root-cause proof)
//   message_code     : fixed UNCLASSIFIED_ERROR notice for unknown signatures
// Every emitted value is revalidated by formatLines. Boundary, phase and model
// are intentionally omitted: this minimal parser cannot attest those facts.
//
// Any message needed to classify the error is inspected in memory only and then
// discarded. Absence of evidence yields UNKNOWN. The script always exits 0 (it
// is a reporter, not a gate); it must not mask the original job failure and it
// must not print stack traces or raw payloads.

import { appendFileSync, existsSync, lstatSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

export const CATEGORIES = Object.freeze([
  'AUTHENTICATION',
  'PERMISSION',
  'RATE_LIMIT',
  'MODEL_OR_REQUEST',
  'SERVICE_UNAVAILABLE',
  'SDK_OR_CONFIGURATION',
  'UNKNOWN',
]);

const DEFAULT_MAX_BYTES = 5 * 1024 * 1024;

// Ordered rules; first match wins. Needles are matched against lowercased text.
// Keyword-only: numeric HTTP codes are handled separately (see categoryFromCodes)
// to avoid false positives on ids, byte counts and timestamps.
const RULES = Object.freeze([
  ['AUTHENTICATION', [
    'authentication_error', 'invalid x-api-key', 'invalid api key', 'invalid_api_key',
    'x-api-key header is required', 'oauth token', 'oauth_token', 'setup-token',
    'token has expired', 'token expired', 'expired token', 'invalid bearer token',
    'unauthorized', 'not authenticated', 'authentication failed',
    'could not resolve authentication', 'missing api key', 'no api key',
    'invalid authorization', 'oauth authentication',
  ]],
  ['PERMISSION', [
    'permission_error', 'permission denied', 'forbidden', 'not allowed to',
    'does not have permission', 'do not have permission', 'insufficient permission',
    'insufficient permissions', 'access denied', 'not permitted',
  ]],
  ['RATE_LIMIT', [
    'rate_limit_error', 'rate limit', 'rate-limit', 'ratelimit', 'too many requests',
    'quota exceeded', 'usage limit', 'billing hard limit',
  ]],
  ['SERVICE_UNAVAILABLE', [
    'overloaded_error', 'overloaded', 'service unavailable', 'internal server error',
    'api_error', 'bad gateway', 'gateway timeout', 'temporarily unavailable',
  ]],
  ['MODEL_OR_REQUEST', [
    'invalid_request_error', 'not_found_error', 'model not found', 'unknown model',
    'unsupported model', 'invalid model', 'context length', 'max_tokens',
    'prompt is too long', 'request_too_large', 'request too large',
  ]],
  ['SDK_OR_CONFIGURATION', [
    'ajv', 'keyword:"dependencies"', 'schema validation', 'schemavalidation',
    'validation error', 'sdk execution error', 'error_during_execution',
    'exited with code', 'process exited', 'enoent', 'cannot find module',
    'spawn', 'econnrefused', 'undefined is not', 'settingsources',
    'configuration', 'misconfigured', 'parse error',
  ]],
]);

// 3-digit 4xx/5xx that immediately follows a status/code/http/error token.
const HTTP_CODE_RE = /(?:\bhttp\b|\bstatus(?:_code)?\b|\bcode\b|\berror\b)["'\s:=/-]{0,6}([45]\d{2})\b/gi;

/** Map an HTTP status code to a category. Returns undefined when not decisive. */
function categoryFromCode(code) {
  if (code === 401) return 'AUTHENTICATION';
  if (code === 403) return 'PERMISSION';
  if (code === 429) return 'RATE_LIMIT';
  if (code === 400 || code === 404 || code === 413 || code === 422) return 'MODEL_OR_REQUEST';
  if (code >= 500 && code <= 599) return 'SERVICE_UNAVAILABLE';
  return undefined;
}

const MAX_CLASSIFY_CHARS = 200_000;

/** Classify a text blob into a fixed category. Text is never returned or logged. */
export function classify(text) {
  if (typeof text !== 'string' || text.length === 0) return 'UNKNOWN';
  const hay = text.slice(0, MAX_CLASSIFY_CHARS).toLowerCase();
  for (const [category, needles] of RULES) {
    for (const needle of needles) {
      if (hay.includes(needle)) return category;
    }
  }
  return 'UNKNOWN';
}

/** Extract unique 4xx/5xx status codes from a text blob. Returns sorted ints. */
export function extractHttpCodes(text) {
  if (typeof text !== 'string' || text.length === 0) return [];
  const found = new Set();
  const hay = text.slice(0, MAX_CLASSIFY_CHARS);
  for (const match of hay.matchAll(HTTP_CODE_RE)) {
    const code = Number.parseInt(match[1], 10);
    if (code >= 400 && code <= 599) found.add(code);
  }
  return [...found].sort((a, b) => a - b);
}

// Closed values only: no SDK strings are reflected into the diagnostic output.
const ERROR_TYPES = Object.freeze([
  'authentication_error', 'permission_error', 'rate_limit_error',
  'overloaded_error', 'api_error', 'invalid_request_error', 'not_found_error',
]);
const SOURCES = Object.freeze(['RESULT', 'SYSTEM', 'ASSISTANT', 'MULTIPLE']);
const UNKNOWN_MESSAGE = 'UNCLASSIFIED_ERROR — original message withheld';
const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const isHttpStatus = (value) => Number.isInteger(value) && value >= 400 && value <= 599;

/** Read known error envelopes only. Never walk arbitrary payloads or stringify them. */
function collectErrorEvidence(doc) {
  const parts = [];
  const codes = new Set();
  const types = new Set();
  const sources = new Set();
  let remaining = MAX_CLASSIFY_CHARS;
  const pushString = (value, source) => {
    if (typeof value !== 'string' || value.length === 0 || remaining === 0) return;
    const part = value.slice(0, remaining);
    parts.push(part);
    remaining -= part.length;
    sources.add(source);
  };
  // Explicit envelope depth; headers, body, request IDs, tools and arbitrary
  // nested objects are never traversed. All text stays inside this function.
  const visitError = (node, source, depth = 0) => {
    if (typeof node === 'string') { pushString(node, source); return; }
    if (!isRecord(node) || depth > 2) return;
    for (const key of ['status', 'status_code', 'statusCode', 'http_status']) {
      if (isHttpStatus(node[key])) { codes.add(node[key]); sources.add(source); }
    }
    if (ERROR_TYPES.includes(node.type)) {
      types.add(node.type);
    }
    // Preserve classification of legacy error.type strings, without reflecting
    // unknown types in output. Outer event discriminators are metadata only.
    if (depth > 0 || ERROR_TYPES.includes(node.type)) pushString(node.type, source);
    pushString(node.message, source);
    pushString(node.result, source);
    // subtype is metadata, not evidence text (including subtype:"success").
    if (node.error !== undefined) visitError(node.error, source, depth + 1);
    if (Array.isArray(node.errors)) {
      for (const entry of node.errors) visitError(entry, source, depth + 1);
    }
  };
  const messages = Array.isArray(doc) ? doc : Array.isArray(doc?.messages) ? doc.messages : [];
  // An SDK assistant API error may precede the terminal error result and have
  // no separate error marker. Do not scan normal assistant conversation unless
  // the terminal result is an error, or that assistant event marks an error.
  const lastResult = messages.findLast((msg) => isRecord(msg) && msg.type === 'result');
  let resultSeen = false;
  let isError;
  for (const msg of messages) {
    if (!isRecord(msg)) continue;
    if (msg.type === 'result') {
      resultSeen = true;
      if (typeof msg.is_error === 'boolean') isError = msg.is_error;
      visitError(msg, 'RESULT');
    } else if (msg.type === 'system' && (msg.subtype === 'error' || msg.error)) {
      visitError(msg, 'SYSTEM');
    } else if (msg.type === 'assistant' &&
      (msg.is_error === true || msg.error || lastResult?.is_error === true)) {
      visitError(msg, 'ASSISTANT');
      if (isRecord(msg.message)) {
        visitError(msg.message, 'ASSISTANT');
        if (Array.isArray(msg.message.content)) {
          for (const block of msg.message.content) {
            if (isRecord(block) && block.type === 'text') pushString(block.text, 'ASSISTANT');
          }
        }
      }
    }
  }
  return { text: parts.join('\n'), codes, types, sources, resultSeen, isError };
}

/** Analyse an already-parsed execution document. Pure; no I/O, no logging. */
export function analyzeParsed(doc) {
  const { text, codes, types, sources, resultSeen, isError } = collectErrorEvidence(doc);
  const out = { diagnosis_status: resultSeen ? 'OK' : 'RESULT_NOT_FOUND' };
  if (typeof isError === 'boolean') out.is_error = isError;
  for (const code of extractHttpCodes(text)) codes.add(code);
  const sortedCodes = [...codes].sort((a, b) => a - b);
  if (sortedCodes.length > 0) out.http_status_codes = sortedCodes;

  // Preserve existing keyword precedence; categories are heuristic inference,
  // never a claim of a confirmed provider root cause.
  let category = classify(text);
  if (category === 'UNKNOWN') {
    for (const code of sortedCodes) {
      const mapped = categoryFromCode(code);
      if (mapped) { category = mapped; break; }
    }
  }
  out.error_category = category;
  if (types.size === 1) out.error_type = [...types][0];
  if (sources.size > 0) out.evidence_source = sources.size === 1 ? [...sources][0] : 'MULTIPLE';
  if (category !== 'UNKNOWN') out.evidence_kind = 'INFERRED';
  else out.message_code = UNKNOWN_MESSAGE;
  return out;
}

/**
 * Read + validate the execution file, then analyse it.
 * Returns a plain object with only whitelisted fields. Never throws.
 */
export function runDiagnosis({ executionFile, runnerTemp, maxBytes = DEFAULT_MAX_BYTES } = {}) {
  const fail = (status) => ({ diagnosis_status: status, error_category: 'UNKNOWN' });
  try {
    if (typeof executionFile !== 'string' || executionFile.trim() === '') {
      return fail('EXECUTION_FILE_MISSING');
    }
    if (typeof runnerTemp !== 'string' || runnerTemp.trim() === '') {
      return fail('EXECUTION_FILE_INVALID');
    }
    const abs = resolve(executionFile);
    if (!existsSync(abs)) return fail('EXECUTION_FILE_MISSING');

    // Reject symlinks outright, before any path canonicalisation.
    const linkStat = lstatSync(abs);
    if (linkStat.isSymbolicLink()) return fail('EXECUTION_FILE_INVALID');

    // Canonical path must live strictly inside the canonical RUNNER_TEMP.
    let realFile;
    let realTemp;
    try {
      realFile = realpathSync(abs);
      realTemp = realpathSync(resolve(runnerTemp));
    } catch {
      return fail('EXECUTION_FILE_INVALID');
    }
    // `realpathSync` above already resolved every symlink in the path; the
    // canonical file must sit strictly inside the canonical RUNNER_TEMP.
    const prefix = realTemp.endsWith(sep) ? realTemp : realTemp + sep;
    if (!realFile.startsWith(prefix)) {
      return fail('EXECUTION_FILE_INVALID');
    }

    const fileStat = statSync(realFile);
    if (!fileStat.isFile()) return fail('EXECUTION_FILE_INVALID');
    if (fileStat.size <= 0 || fileStat.size > maxBytes) return fail('EXECUTION_FILE_INVALID');

    let doc;
    try {
      doc = JSON.parse(readFileSync(realFile, 'utf8'));
    } catch {
      return fail('EXECUTION_FILE_INVALID');
    }
    return analyzeParsed(doc);
  } catch {
    return fail('DIAGNOSTIC_ERROR');
  }
}

/** Serialise the whitelisted result to stable `key=value` lines. */
export function formatLines(result) {
  const statuses = ['OK', 'EXECUTION_FILE_MISSING', 'EXECUTION_FILE_INVALID', 'RESULT_NOT_FOUND', 'DIAGNOSTIC_ERROR'];
  const status = statuses.includes(result.diagnosis_status) ? result.diagnosis_status : 'DIAGNOSTIC_ERROR';
  const lines = [`diagnosis_status=${status}`];
  if (typeof result.is_error === 'boolean') lines.push(`is_error=${result.is_error}`);
  const codes = Array.isArray(result.http_status_codes)
    ? [...new Set(result.http_status_codes.filter(isHttpStatus))].sort((a, b) => a - b) : [];
  if (codes.length > 0) lines.push(`http_status_codes=${codes.join(',')}`);
  const category = CATEGORIES.includes(result.error_category) ? result.error_category : 'UNKNOWN';
  lines.push(`error_category=${category}`);
  if (ERROR_TYPES.includes(result.error_type)) lines.push(`error_type=${result.error_type}`);
  if (SOURCES.includes(result.evidence_source)) lines.push(`evidence_source=${result.evidence_source}`);
  if (category !== 'UNKNOWN' && result.evidence_kind === 'INFERRED') lines.push('evidence_kind=INFERRED');
  if (result.message_code === UNKNOWN_MESSAGE) lines.push(`message_code=${UNKNOWN_MESSAGE}`);
  return lines;
}

function main() {
  let lines;
  try {
    const result = runDiagnosis({
      executionFile: process.env.CLAUDE_EXECUTION_FILE,
      runnerTemp: process.env.RUNNER_TEMP,
      maxBytes: Number.parseInt(process.env.MAX_EXECUTION_FILE_BYTES ?? '', 10) || DEFAULT_MAX_BYTES,
    });
    lines = formatLines(result);
  } catch {
    lines = ['diagnosis_status=DIAGNOSTIC_ERROR', 'error_category=UNKNOWN'];
  }

  const body = lines.join('\n');
  for (const target of [process.env.GITHUB_OUTPUT, process.env.GITHUB_STEP_SUMMARY]) {
    if (!target) continue;
    try {
      appendFileSync(target, `${body}\n`);
    } catch {
      /* reporting only; never fail the step for a write error */
    }
  }
  console.log(body);
  // Reporter only: leave the exit code at 0 so the ORIGINAL job failure
  // (the Claude Code step) is preserved as the job's failure, untouched.
  process.exitCode = 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
