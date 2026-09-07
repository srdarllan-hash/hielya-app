'use client';

import React, { forwardRef, useId, useState } from 'react';

export interface FieldFeedbackProps {
  helper?: string;
  error?: string;
  success?: string;
  /** Only a newly submitted error is announced; blur/change errors remain described. */
  errorSource?: 'blur' | 'change' | 'submit';
}

export function FieldFeedback({ id, helper, error, success, errorSource }: FieldFeedbackProps & { id: string }) {
  return <div className="hly-field__feedback">
    {helper && <p id={`${id}-helper`}>{helper}</p>}
    {error ? <p id={`${id}-error`} className="hly-field__error" role={errorSource === 'submit' ? 'alert' : undefined}>{error}</p>
      : success ? <p id={`${id}-success`} className="hly-field__success">{success}</p> : null}
  </div>;
}

export function fieldDescriptions(id: string, props: FieldFeedbackProps, extra?: string) {
  return [extra, props.helper && `${id}-helper`, props.error ? `${id}-error` : props.success && `${id}-success`].filter(Boolean).join(' ') || undefined;
}

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'defaultValue' | 'type' | 'prefix'>, FieldFeedbackProps {
  label: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  type?: 'text' | 'tel' | 'email' | 'password' | 'search';
  loading?: boolean;
  prefix?: string;
  suffix?: string;
}

/** Shared native control for Input and the six real OTP cells. No value instrumentation. */
export const InputControl = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function InputControl({ className = '', ...props }, ref) {
  return <input {...props} ref={ref} className={`hly-field__control ${className}`} />;
});

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({
  label, id: suppliedId, value, defaultValue = '', onChange, type = 'text',
  helper, error, success, errorSource, loading = false, disabled = false, readOnly = false,
  prefix, suffix, autoFocus = false, className = '', onKeyDown, 'aria-describedby': describedBy, ...rest
}, ref) {
  const generatedId = useId();
  const id = suppliedId ?? generatedId;
  const [internalValue, setInternalValue] = useState(defaultValue);
  const current = value ?? internalValue;
  const feedback = { helper: readOnly && !disabled && !loading ? [helper, 'Solo lectura.'].filter(Boolean).join(' ') : helper, error, success, errorSource };
  return <div className={`hly-field ${className}`} data-disabled={disabled || undefined} data-invalid={Boolean(error) || undefined} data-loading={loading && !disabled || undefined}>
    <label className="hly-field__label" htmlFor={id}>{label}</label>
    <div className="hly-field__box" aria-busy={loading && !disabled || undefined}>
      {prefix && <span className="hly-field__adornment" id={`${id}-prefix`}>{prefix}</span>}
      <InputControl {...rest} ref={ref} id={id} type={type} value={current} disabled={disabled} readOnly={readOnly || loading}
        autoFocus={autoFocus} aria-invalid={Boolean(error) || rest['aria-invalid'] || undefined}
        aria-describedby={fieldDescriptions(id, feedback, [describedBy, prefix && `${id}-prefix`].filter(Boolean).join(' '))}
        onChange={(event) => {
          if (disabled || readOnly || loading) return;
          if (value === undefined) setInternalValue(event.target.value);
          onChange?.(event.target.value);
        }}
        onKeyDown={(event) => {
          if ((disabled || loading) && event.key === 'Enter') event.preventDefault();
          onKeyDown?.(event);
        }} />
      {(loading && !disabled || suffix) && <span className="hly-field__adornment" aria-hidden="true">{loading && !disabled ? 'Procesando…' : suffix}</span>}
    </div>
    <FieldFeedback id={id} {...feedback} />
  </div>;
});
