// Offline preparation for Issue #72. Not connected to a provider or workflow.
// The eventual trusted transport must reserve BEFORE sending a request and
// terminate permanently if this process exits. Recreating this object is not
// a supported recovery or retry mechanism for the same proof.
const MODEL = 'gpt-5.6-sol';
const CAP_MICRO_USD = 800_000; // Below the owner's USD 1 total ceiling.
const MAX_REQUESTS = 8;
const MAX_OUTPUT_TOKENS = 1024;
// Conservative standard-tier rates: input includes the published cache-write
// premium (USD 5/M); output USD 20/M. Pricing must be reverified at activation.
const INPUT_MICRO_USD = 5;
const OUTPUT_MICRO_USD = 20;

export class CodexProofBudget {
  #reserved = 0;
  #requests = 0;
  #seen = new Set();
  #closed = false;

  // inputTokens must come from a trusted count of the EXACT final request,
  // including instructions and tool schemas. Model prose/character estimates
  // are not valid inputs. Counting fees and every other billable operation
  // remain an activation prerequisite; this class accounts for generation only.
  reserve({ requestId, model, inputTokens, maxOutputTokens } = {}) {
    if (this.#closed) return { status: 'BLOCKED', reason: 'CLOSED' };
    if (typeof requestId !== 'string' || !/^probe-[1-8]$/.test(requestId)
      || model !== MODEL
      || !Number.isSafeInteger(inputTokens) || inputTokens < 0
      || !Number.isSafeInteger(maxOutputTokens) || maxOutputTokens < 1
      || maxOutputTokens > MAX_OUTPUT_TOKENS) {
      return this.#block('INVALID_REQUEST');
    }
    if (this.#seen.has(requestId)) return this.#block('RETRY_FORBIDDEN');
    if (this.#requests >= MAX_REQUESTS) return this.#block('REQUEST_LIMIT');
    // BigInt prevents overflow for hostile numeric inputs before comparison.
    const cost = BigInt(inputTokens) * BigInt(INPUT_MICRO_USD)
      + BigInt(maxOutputTokens) * BigInt(OUTPUT_MICRO_USD);
    if (cost > BigInt(CAP_MICRO_USD - this.#reserved)) {
      return this.#block('BUDGET_LIMIT');
    }
    this.#seen.add(requestId);
    this.#requests += 1;
    this.#reserved += Number(cost);
    // Never refund unused tokens: a lost response remains fully charged to
    // this conservative allowance. No response body or free text is accepted.
    return { status: 'RESERVED', reserved_micro_usd: Number(cost) };
  }

  abort() { this.#closed = true; }

  snapshot() {
    return {
      status: this.#closed ? 'CLOSED' : 'OPEN',
      requests_reserved: this.#requests,
      reserved_micro_usd: this.#reserved,
      remaining_micro_usd: CAP_MICRO_USD - this.#reserved,
    };
  }

  #block(reason) {
    this.#closed = true;
    return { status: 'BLOCKED', reason };
  }
}
