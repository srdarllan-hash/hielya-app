export interface CompiledTokens {
  css: string;
  ts: string;
  csv: string;
  count: number;
}
export function serializeTokenValue(value: unknown, type?: string): string;
export function compileTokens(source: Record<string, unknown>): CompiledTokens;
