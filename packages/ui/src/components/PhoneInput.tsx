'use client';

import React, { forwardRef, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import { Input, type InputProps } from './Input';

export interface PhoneValue { nationalDigits: string; e164: string | null; }
export interface PhoneInputProps extends Omit<InputProps, 'type' | 'inputMode' | 'autoComplete' | 'onChange' | 'prefix' | 'pattern' | 'maxLength'> {
  onChange?: (value: PhoneValue) => void;
}
export const fullWidthDigits = (value: string) => value.replace(/[０-９]/g, (digit) => String.fromCharCode(digit.charCodeAt(0) - 0xfee0));
const mask = (digits: string) => digits.replace(/(\d{3})(?=\d)/g, '$1 ');
function normalize(source: string): string | null {
  const value = fullWidthDigits(source);
  if (/[^0-9+().\s-]/.test(value)) return null;
  const compact = value.replace(/[().\s-]/g, '');
  const national = compact.startsWith('+34') ? compact.slice(3) : compact.startsWith('0034') ? compact.slice(4) : compact;
  return /^\d{0,9}$/.test(national) ? national : null;
}
const phoneValue = (nationalDigits: string): PhoneValue => ({ nationalDigits, e164: nationalDigits.length === 9 ? `+34${nationalDigits}` : null });
const formatError = (digits: string, required?: boolean) => !digits && !required ? undefined : !digits ? 'Introduce tu número de teléfono.' : digits.length !== 9 ? 'Introduce un número válido de 9 dígitos.' : undefined;
const digitCount = (value: string) => (fullWidthDigits(value).match(/[0-9]/g) ?? []).length;
const caretFor = (value: string, digits: number) => {
  let count = 0;
  for (let index = 0; index < value.length; index += 1) {
    if (/\d/.test(value[index])) count += 1;
    if (count === digits) return index + 1;
  }
  return digits === 0 ? 0 : value.length;
};

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(function PhoneInput({
  value, defaultValue = '', onChange, label = 'Número de teléfono', helper = 'Introduce los 9 dígitos de tu número de España.',
  placeholder = '___ ___ ___', error, errorSource, required, disabled, readOnly, loading,
  onBlur, onFocus, onPaste, onKeyDown, onInvalid, onCompositionStart, onCompositionEnd, ...rest
}, ref) {
  const input = useRef<HTMLInputElement>(null);
  useImperativeHandle(ref, () => input.current!, []);
  const [internal, setInternal] = useState(defaultValue);
  const current = value ?? internal;
  const [localError, setLocalError] = useState<string>();
  const [source, setSource] = useState<'blur' | 'change' | 'submit'>('blur');
  const validated = useRef(false);
  const composing = useRef(false);
  const [draft, setDraft] = useState<string>();
  const caret = useRef<number | null>(null);
  const blocked = disabled || readOnly || loading;
  const commit = (next: string, position: number) => {
    if (blocked) return;
    caret.current = position;
    if (value === undefined) setInternal(next);
    if (validated.current) { setLocalError(formatError(next, required)); setSource('change'); }
    else setLocalError(undefined);
    if (next !== current) onChange?.(phoneValue(next));
  };
  useLayoutEffect(() => {
    if (caret.current !== null && input.current && !composing.current) {
      const position = caretFor(input.current.value, caret.current);
      input.current.setSelectionRange(position, position);
      caret.current = null;
    }
  });
  const validate = () => { validated.current = true; setLocalError(formatError(current, required)); };
  return <Input {...rest} ref={input} label={label} helper={helper} placeholder={placeholder} prefix="+34"
    type="tel" inputMode="tel" autoComplete="tel" value={draft ?? mask(current)} required={required}
    pattern="[0-9]{3} [0-9]{3} [0-9]{3}" disabled={disabled} readOnly={readOnly} loading={loading}
    error={error ?? localError} errorSource={error ? errorSource : source}
    onChange={(text) => {
      if (composing.current) { setDraft(text); return; }
      const next = normalize(text);
      if (next !== null) commit(next, digitCount(text.slice(0, input.current?.selectionStart ?? text.length)) - (text.startsWith('+34') ? 2 : text.startsWith('0034') ? 4 : 0));
    }}
    onFocus={onFocus}
    onBlur={(event) => { if (!blocked) { validate(); setSource('blur'); } onBlur?.(event); }}
    onInvalid={(event) => { event.preventDefault(); if (!blocked) { validate(); setSource('submit'); input.current?.focus(); } onInvalid?.(event); }}
    onPaste={(event) => {
      onPaste?.(event);
      if (event.defaultPrevented) return;
      event.preventDefault();
      if (blocked) return;
      const raw = event.clipboardData.getData('text');
      const next = normalize(raw);
      if (next === null) { setLocalError('No se ha pegado el contenido. Revisa el formato.'); setSource('change'); return; }
      const start = digitCount(event.currentTarget.value.slice(0, event.currentTarget.selectionStart ?? 0));
      const end = digitCount(event.currentTarget.value.slice(0, event.currentTarget.selectionEnd ?? 0));
      const prefixed = /^[\s]*(?:\+34|0034)/.test(fullWidthDigits(raw));
      const result = prefixed ? next : current.slice(0, start) + next + current.slice(end);
      if (result.length > 9) { setLocalError('No se ha pegado el contenido. Revisa el formato.'); setSource('change'); return; }
      commit(result, prefixed ? result.length : start + next.length);
    }}
    onKeyDown={(event) => {
      onKeyDown?.(event);
      if (event.defaultPrevented || blocked || composing.current || event.nativeEvent.isComposing) return;
      if (event.key !== 'Backspace' && event.key !== 'Delete') return;
      const start = digitCount(event.currentTarget.value.slice(0, event.currentTarget.selectionStart ?? 0));
      const end = digitCount(event.currentTarget.value.slice(0, event.currentTarget.selectionEnd ?? 0));
      event.preventDefault();
      const from = start === end && event.key === 'Backspace' ? Math.max(0, start - 1) : start;
      const to = start === end && event.key === 'Delete' ? Math.min(current.length, end + 1) : end;
      commit(current.slice(0, from) + current.slice(to), from);
    }}
    onCompositionStart={(event) => { composing.current = true; setDraft(event.currentTarget.value); onCompositionStart?.(event); }}
    onCompositionEnd={(event) => {
      composing.current = false; setDraft(undefined);
      const next = normalize(event.currentTarget.value);
      if (next !== null) commit(next, digitCount(event.currentTarget.value.slice(0, event.currentTarget.selectionStart ?? 0)));
      onCompositionEnd?.(event);
    }} />;
});
