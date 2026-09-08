/** Explicit separation of historical Gate admission from frozen-content regression.
 * No allowlist is widened. Omitting a mode retains the original admission check.
 */
export const validateScopeMode = (mode) => {
  if (!['historical', 'regression'].includes(mode)) {
    throw new Error(`Unsupported validator scope mode: ${mode}`);
  }
  return mode;
};

export const parseScopeMode = (args) => {
  if (args.length === 0) return 'historical';
  if (args.length !== 1 || !args[0].startsWith('--scope=')) {
    throw new Error('Expected only --scope=historical or --scope=regression');
  }
  return validateScopeMode(args[0].slice('--scope='.length));
};
