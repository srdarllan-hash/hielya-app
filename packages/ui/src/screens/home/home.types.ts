export const HOME_STATES = ['ready','loading','closed','high-demand','error','empty-cart','alcohol-cutoff','out-of-area'] as const;
export type HomeState = typeof HOME_STATES[number];
export function coerceHomeState(value?: string): HomeState { return HOME_STATES.includes(value as HomeState) ? value as HomeState : 'ready'; }
