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

/** Pull only the error-bearing substrings out of the parsed execution document. */
function collectErrorText(doc) {
  const parts = [];
  const pushString = (value) => {
    if (typeof value === 'string' && value.length > 0) parts.push(value);
  };
  const visitResult = (node) => {
    if (!node || typeof node !== 'object') return;
    pushString(node.result);
    pushString(node.error);
    pushString(node.message);
    pushString(node.subtype);
    if (node.error && typeof node.error === 'object') {
      pushString(node.error.message);
      pushString(node.error.type);
    }
    if (Array.isArray(node.errors)) {
      for (const entry of node.errors) {
        if (typeof entry === 'string') pushString(entry);
        else if (entry && typeof entry === 'object') {
          pushString(entry.message);
          pushString(entry.type);
        }
      }
    }
  };

  const messages = Array.isArray(doc) ? doc : Array.isArray(doc?.messages) ? doc.messages : [];
  let resultSeen = false;
  let isError;
  for (const msg of messages) {
    if (!msg || typeof msg !== 'object') continue;
    if (msg.type === 'result') {
      resultSeen = true;
      if (typeof msg.is_error === 'boolean') isError = msg.is_error;
      visitResult(msg);
    } else if (msg.type === 'system' && (msg.subtype === 'error' || msg.error)) {
      visitResult(msg);
    }
  }

  // Fall back to a bounded stringify only when no targeted field was found.
  let text = parts.join('\n');
  if (text.length === 0 && (Array.isArray(doc) || doc)) {
    try {
      text = JSON.stringify(doc).slice(0, MAX_CLASSIFY_CHARS);
    } catch {
      text = '';
    }
  }
  return { text, resultSeen, isError };
}

/** Analyse an already-parsed execution document. Pure; no I/O, no logging. */
export function analyzeParsed(doc) {
  const { text, resultSeen, isError } = collectErrorText(doc);
  const out = { diagnosis_status: resultSeen ? 'OK' : 'RESULT_NOT_FOUND' };
  if (typeof isError === 'boolean') out.is_error = isError;

  const codes = extractHttpCodes(text);
  if (codes.length > 0) out.http_status_codes = codes;

  // Keyword match wins; fall back to an HTTP-code-derived category; else UNKNOWN.
  let category = classify(text);
  if (category === 'UNKNOWN') {
    for (const code of codes) {
      const mapped = categoryFromCode(code);
      if (mapped) { category = mapped; break; }
    }
  }
  out.error_category = category;
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
  const lines = [`diagnosis_status=${result.diagnosis_status}`];
  if (typeof result.is_error === 'boolean') lines.push(`is_error=${result.is_error}`);
  if (Array.isArray(result.http_status_codes) && result.http_status_codes.length > 0) {
    lines.push(`http_status_codes=${result.http_status_codes.join(',')}`);
  }
  const category = CATEGORIES.includes(result.error_category) ? result.error_category : 'UNKNOWN';
  lines.push(`error_category=${category}`);
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
