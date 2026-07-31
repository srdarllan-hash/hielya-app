export interface HielyaUiActionDetail {
  action: string;
  value?: string;
}

export function emitHielyaUiAction(action: string, value?: string) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<HielyaUiActionDetail>('hielya:ui-action', { detail: { action, value } }));
}
