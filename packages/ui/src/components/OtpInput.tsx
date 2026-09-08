'use client';

import React, { forwardRef, useId, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import { Button } from './Button';
import { FieldFeedback, InputControl, fieldDescriptions, type FieldFeedbackProps } from './Input';
import { fullWidthDigits } from './PhoneInput';

export type OtpPositions = readonly [string, string, string, string, string, string];
export interface OtpValue { positions: OtpPositions; completeCode: string | null; }
export type OtpStatus = 'idle' | 'loading' | 'invalid' | 'expired' | 'locked' | 'cooldown' | 'network-error' | 'unavailable' | 'service-unavailable' | 'success';
export interface OtpInputProps extends FieldFeedbackProps {
  id?: string;
  label?: string;
  value?: OtpPositions;
  defaultValue?: OtpPositions;
  onChange?: (value: OtpValue) => void;
  onComplete?: (code: string) => void;
  /** Explicit intent only; consumer performs transport and locks before awaiting. */
  onRetry?: (code: string) => void;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  onFocus?: React.FocusEventHandler<HTMLInputElement>;
  status?: OtpStatus;
  disabled?: boolean;
  readOnly?: boolean;
  autoFocus?: boolean;
  required?: boolean;
  className?: string;
  'aria-describedby'?: string;
  /** Server-derived remaining cooldown, never started by the component. */
  cooldownSeconds?: number;
}
const empty = (): OtpPositions => ['', '', '', '', '', ''];
function positions(value: OtpPositions): OtpPositions {
  return Array.from({ length: 6 }, (_, i) => /^[0-9]$/.test(value[i] ?? '') ? value[i] : '') as unknown as OtpPositions;
}
const complete = (value: OtpPositions): string | null => value.every((digit) => /^[0-9]$/.test(digit)) ? value.join('') : null;
const messages: Partial<Record<OtpStatus, string>> = {
  invalid: 'El código no es válido. Introduce los 6 dígitos de nuevo.',
  expired: 'El código ha caducado. Solicita uno nuevo cuando esté disponible.',
  locked: 'Has alcanzado el límite de intentos. Espera para solicitar otro código.',
  'network-error': 'No hemos podido confirmar el resultado. Comprueba tu conexión.',
  unavailable: 'Este código no está disponible. Solicita otro cuando puedas.',
  'service-unavailable': 'El servicio no está disponible temporalmente.',
};

export const OtpInput = forwardRef<HTMLInputElement, OtpInputProps>(function OtpInput({
  id: suppliedId, label = 'Código de verificación', value, defaultValue = empty(), onChange, onComplete, onRetry,
  status = 'idle', disabled = false, readOnly = false, autoFocus = false, required = false,
  helper = 'Introduce los 6 dígitos. Se verificará automáticamente.', error, success, errorSource,
  cooldownSeconds, className = '', onBlur, onFocus, 'aria-describedby': extraDescription,
}, ref) {
  const generatedId = useId();
  const id = suppliedId ?? generatedId;
  const cells = useRef<(HTMLInputElement | null)[]>([]);
  useImperativeHandle(ref, () => cells.current[0]!, []);
  const [internal, setInternal] = useState<OtpPositions>(() => positions(defaultValue));
  const current = positions(value ?? internal);
  const [active, setActive] = useState(0);
  const [pasteError, setPasteError] = useState<string>();
  const summary = useRef<HTMLDivElement>(null);
  const retry = useRef<HTMLDivElement>(null);
  const inFlight = useRef(false);
  const lastComplete = useRef<string | null>(null);
  const previousStatus = useRef<OtpStatus | undefined>(undefined);
  const composed = useRef<number | null>(null);
  const [compositionDraft, setCompositionDraft] = useState<{ index: number; text: string }>();
  const callback = useRef(onChange);
  callback.current = onChange;
  const loading = status === 'loading';
  const terminal = ['expired', 'locked', 'cooldown', 'unavailable', 'success'].includes(status);
  const blocked = disabled || readOnly || loading || terminal;
  const effectiveError = error ?? pasteError ?? (status === 'cooldown' && cooldownSeconds !== undefined ? `Podrás solicitar otro código en ${Math.max(0, Math.ceil(cooldownSeconds))} s.` : messages[status]);
  const feedback: FieldFeedbackProps = {
    helper: loading ? 'Verificando código…' : readOnly ? `${helper} Solo lectura.` : helper,
    error: effectiveError, success, errorSource: status === 'cooldown' ? 'change' : errorSource ?? (pasteError ? 'change' : effectiveError ? 'submit' : undefined),
  };
  const focus = (index: number) => { setActive(index); cells.current[index]?.focus(); };
  useLayoutEffect(() => {
    if (previousStatus.current === status) return;
    const initial = previousStatus.current === undefined;
    previousStatus.current = status;
    inFlight.current = loading;
    if (['invalid', 'expired', 'locked', 'cooldown'].includes(status)) {
      setInternal(empty()); setPasteError(undefined); lastComplete.current = null;
      // Controlled values are owned by the consumer; emit a reset request once per result transition.
      callback.current?.({ positions: empty(), completeCode: null });
    }
    if (disabled) return;
    if (status === 'invalid' && !readOnly) focus(0);
    else if (status === 'network-error' && onRetry) retry.current?.querySelector('button')?.focus();
    else if (terminal && status !== 'success') summary.current?.focus();
    else if (initial && autoFocus && !blocked) focus(0);
  }, [status, loading, disabled, readOnly, autoFocus, blocked, terminal, onRetry]);

  const emit = (next: OtpPositions) => {
    if (blocked || inFlight.current) return;
    setPasteError(undefined);
    if (value === undefined) setInternal(next);
    const code = complete(next);
    onChange?.({ positions: next, completeCode: code });
    if (!code) lastComplete.current = null;
    if (code && code !== lastComplete.current && onComplete) {
      lastComplete.current = code;
      inFlight.current = true;
      onComplete(code);
    }
  };
  const distribute = (source: string) => {
    if (blocked || inFlight.current) return;
    const normalized = fullWidthDigits(source).replace(/[\s-]/g, '');
    if (!/^[0-9]*$/.test(normalized)) { setPasteError('No se ha pegado el contenido. Revisa el formato.'); return; }
    const digits = normalized.slice(0, 6);
    const next = Array.from({ length: 6 }, (_, i) => digits[i] ?? '') as unknown as OtpPositions;
    focus(Math.min(digits.length, 5));
    emit(next);
  };
  const edit = (index: number, source: string) => {
    if (blocked || inFlight.current) return;
    const text = fullWidthDigits(source);
    if (text.length > 1) { distribute(text); return; }
    if (!/^[0-9]?$/.test(text)) return;
    const next = [...current] as unknown as [string, string, string, string, string, string];
    next[index] = text;
    if (text) focus(Math.min(index + 1, 5));
    emit(next);
  };
  const cell = (index: number) => <InputControl key={index} id={`${id}-${index}`} ref={(node) => { cells.current[index] = node; }}
    className="hly-otp__cell" type="text" inputMode="numeric" autoComplete={index === 0 ? 'one-time-code' : 'off'}
    aria-label={`Dígito ${index + 1} de 6`} aria-invalid={Boolean(effectiveError) || undefined}
    aria-describedby={fieldDescriptions(id, feedback, extraDescription)}
    value={compositionDraft?.index === index ? compositionDraft.text : current[index]}
    disabled={disabled || terminal} readOnly={readOnly || loading} required={required}
    tabIndex={active === index ? 0 : -1}
    onFocus={(event) => { setActive(index); event.currentTarget.select(); onFocus?.(event); }} onBlur={onBlur}
    onClick={(event) => event.currentTarget.select()}
    onChange={(event) => {
      if (composed.current === index) { setCompositionDraft({ index, text: event.currentTarget.value }); return; }
      edit(index, event.currentTarget.value);
    }}
    onPaste={(event) => { event.preventDefault(); distribute(event.clipboardData.getData('text')); }}
    onCompositionStart={(event) => { composed.current = index; setCompositionDraft({ index, text: event.currentTarget.value }); }}
    onCompositionEnd={(event) => { composed.current = null; setCompositionDraft(undefined); edit(index, event.currentTarget.value); }}
    onKeyDown={(event) => {
      if (event.nativeEvent.isComposing || composed.current !== null) return;
      if (event.key === 'Enter') { event.preventDefault(); return; }
      if (event.key === 'Tab') return;
      const target = event.key === 'ArrowLeft' ? Math.max(0, index - 1) : event.key === 'ArrowRight' ? Math.min(5, index + 1) : event.key === 'Home' ? 0 : event.key === 'End' ? 5 : undefined;
      if (target !== undefined) { event.preventDefault(); focus(target); return; }
      if (blocked || inFlight.current) return;
      if (event.key === 'Backspace' || event.key === 'Delete') {
        event.preventDefault();
        const at = event.key === 'Backspace' && !current[index] ? Math.max(0, index - 1) : index;
        const next = [...current] as unknown as [string, string, string, string, string, string];
        next[at] = ''; focus(at); emit(next);
      }
    }} />;
  return <div className={`hly-field hly-otp ${className}`} role="group" aria-labelledby={`${id}-label`} aria-busy={loading || undefined} data-invalid={Boolean(effectiveError) || undefined}>
    <span id={`${id}-label`} className="hly-field__label">{label}</span>
    <div className="hly-otp__cells">{[0, 3].map((start) => <div className="hly-otp__triplet" key={start}>{[start, start + 1, start + 2].map(cell)}</div>)}</div>
    <div className="hly-otp__summary" ref={summary} tabIndex={-1} aria-describedby={fieldDescriptions(id, feedback, extraDescription)}>
      <FieldFeedback id={id} {...feedback} />
    </div>
    {status === 'network-error' && onRetry && <div className="hly-otp__retry" ref={retry}><Button variant="secondary" size="md" disabled={disabled || readOnly} onClick={() => {
      const code = complete(current);
      if (!code || blocked || inFlight.current) return;
      inFlight.current = true;
      onRetry(code);
    }}>Reintentar</Button></div>}
  </div>;
});
