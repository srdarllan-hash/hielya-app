import React, { StrictMode, createRef, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Input } from '../../packages/ui/src/components/Input';
import { PhoneInput } from '../../packages/ui/src/components/PhoneInput';
import { OtpInput, type OtpPositions } from '../../packages/ui/src/components/OtpInput';
afterEach(cleanup);
const paste = (input: HTMLElement, text: string) => fireEvent.paste(input, { clipboardData: { getData: () => text } });
const otpCells = () => screen.getAllByRole('textbox') as HTMLInputElement[];
const code: OtpPositions = ['0', '1', '2', '3', '4', '5'];

describe('Input', () => {
  it('supports uncontrolled edits, label, native attributes and ref', () => {
    const ref = createRef<HTMLInputElement>(); const change = vi.fn();
    render(<Input ref={ref} label="Campo" name="campo" required helper="Ayuda" defaultValue="a" onChange={change} />);
    const field = screen.getByLabelText('Campo');
    expect(ref.current).toBe(field); expect(field).toBeRequired(); expect(field).toHaveAccessibleDescription('Ayuda');
    fireEvent.change(field, { target: { value: 'b' } }); expect(field).toHaveValue('b'); expect(change).toHaveBeenCalledWith('b');
  });
  it('controlled value is authoritative and does not use a later defaultValue', () => {
    const { rerender } = render(<Input label="Campo" value="a" defaultValue="ignored" />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'b' } }); expect(screen.getByRole('textbox')).toHaveValue('a');
    rerender(<Input label="Campo" value="c" />); expect(screen.getByRole('textbox')).toHaveValue('c');
  });
  it('invalid wins over success; submit alone adds alert, with stable IDs', () => {
    const { rerender } = render(<Input label="Campo" helper="Ayuda" error="Error" success="Correcto" errorSource="blur" aria-describedby="external" />);
    expect(screen.queryByRole('alert')).toBeNull(); expect(screen.queryByText('Correcto')).toBeNull();
    const id = screen.getByRole('textbox').id;
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    rerender(<Input label="Campo" helper="Ayuda" error="Error" errorSource="submit" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Error'); expect(screen.getByRole('textbox').id).toBe(id);
  });
  it.each(['disabled', 'readOnly', 'loading'] as const)('%s blocks edits but retains value', (state) => {
    const change = vi.fn(); render(<Input label="Campo" defaultValue="a" onChange={change} {...{ [state]: true }} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'b' } }); expect(change).not.toHaveBeenCalled();
    expect(screen.getByRole('textbox')).toHaveValue('a');
    if (state === 'disabled') expect(screen.getByRole('textbox')).toBeDisabled(); else expect(screen.getByRole('textbox')).toHaveAttribute('readonly');
  });
  it('adornments, valid feedback, empty and autofocus opt-in', () => {
    const { rerender } = render(<Input label="Campo" prefix="€" suffix="EUR" success="Correcto" />);
    expect(screen.getByRole('textbox')).toHaveValue(''); expect(screen.getByRole('textbox')).not.toHaveFocus();
    expect(screen.getByRole('textbox')).toHaveAccessibleDescription('€ Correcto');
    rerender(<Input key="focus" label="Campo" autoFocus />); expect(screen.getByRole('textbox')).toHaveFocus();
  });
});

describe('PhoneInput', () => {
  it.each(['612345678', '+34 612 345 678', '0034 (612) 345-678', '６１２３４５６７８'])('normalizes approved paste form %#', (text) => {
    const change = vi.fn(); render(<PhoneInput label="Teléfono" onChange={change} />); paste(screen.getByRole('textbox'), text);
    expect(screen.getByRole('textbox')).toHaveValue('612 345 678'); expect(change).toHaveBeenCalledTimes(1);
    expect(change).toHaveBeenCalledWith({ nationalDigits: '612345678', e164: '+34612345678' });
  });
  it.each(['letters', '6123456789', '+44 612345678', '612345678x'])('rejects entire invalid paste %#', (text) => {
    const change = vi.fn(); render(<PhoneInput label="Teléfono" defaultValue="612" onChange={change} />); paste(screen.getByRole('textbox'), text);
    expect(screen.getByRole('textbox')).toHaveValue('612'); expect(change).not.toHaveBeenCalled();
  });
  it('validates on blur/submit, then revalidates on change with partial normalized callback', () => {
    const change = vi.fn(); render(<PhoneInput label="Teléfono" required onChange={change} />);
    const field = screen.getByRole('textbox'); fireEvent.change(field, { target: { value: '612' } });
    expect(field).not.toHaveAttribute('aria-invalid'); expect(change).toHaveBeenLastCalledWith({ nationalDigits: '612', e164: null });
    fireEvent.blur(field); expect(field).toHaveAttribute('aria-invalid', 'true'); expect(screen.queryByRole('alert')).toBeNull();
    fireEvent.invalid(field); expect(screen.getByRole('alert')).toBeInTheDocument();
    fireEvent.change(field, { target: { value: '612345678' } }); expect(field).not.toHaveAttribute('aria-invalid');
  });
  it('handles Backspace across separators and selected Delete, preserving caret', () => {
    render(<PhoneInput label="Teléfono" defaultValue="612345678" />); const field = screen.getByRole('textbox') as HTMLInputElement;
    field.setSelectionRange(4, 4); fireEvent.keyDown(field, { key: 'Backspace' }); expect(field).toHaveValue('613 456 78'); expect(field.selectionStart).toBe(2);
    field.setSelectionRange(0, 4); fireEvent.keyDown(field, { key: 'Delete' }); expect(field).toHaveValue('456 78'); expect(field.selectionStart).toBe(0);
  });
  it('preserves selection on paste and rejects resulting overflow', () => {
    render(<PhoneInput label="Teléfono" defaultValue="612345678" />); const field = screen.getByRole('textbox') as HTMLInputElement;
    field.setSelectionRange(4, 7); paste(field, '999'); expect(field).toHaveValue('612 999 678');
    field.setSelectionRange(0, 0); paste(field, '1'); expect(field).toHaveValue('612 999 678');
  });
  it('waits until compositionend and accepts full-width composition', () => {
    const change = vi.fn(); render(<PhoneInput label="Teléfono" onChange={change} />); const field = screen.getByRole('textbox');
    fireEvent.compositionStart(field); fireEvent.change(field, { target: { value: '６１２' } }); expect(change).not.toHaveBeenCalled();
    fireEvent.compositionEnd(field); expect(field).toHaveValue('612'); expect(change).toHaveBeenCalledTimes(1);
  });
  it.each(['disabled', 'readOnly', 'loading'] as const)('%s blocks paste', (state) => {
    const change = vi.fn(); render(<PhoneInput label="Teléfono" {...{ [state]: true }} onChange={change} />);
    paste(screen.getByRole('textbox'), '612345678'); expect(change).not.toHaveBeenCalled();
  });
});

describe('OtpInput', () => {
  it('has six real inputs, one Tab entry, no autofocus by default and native ref', () => {
    const ref = createRef<HTMLInputElement>(); render(<OtpInput ref={ref} />); const fields = otpCells();
    expect(fields).toHaveLength(6); expect(fields.filter((cell) => cell.tabIndex === 0)).toHaveLength(1); expect(ref.current).toBe(fields[0]);
    expect(fields[0]).not.toHaveFocus(); expect(fields[0]).toHaveAttribute('autocomplete', 'one-time-code');
    expect(screen.getByRole('group')).toHaveAccessibleName('Código de verificación');
  });
  it.each(['012345', '０１２３４５', '01 23-45', '01234567'])('distributes complete paste %# once even in StrictMode', (text) => {
    const complete = vi.fn(); render(<StrictMode><OtpInput onComplete={complete} /></StrictMode>); paste(otpCells()[0], text);
    expect(otpCells().map((cell) => cell.value)).toEqual(code); expect(otpCells()[5]).toHaveFocus(); expect(complete).toHaveBeenCalledTimes(1);
    paste(otpCells()[0], text); fireEvent.keyDown(otpCells()[5], { key: 'Enter' }); expect(complete).toHaveBeenCalledTimes(1);
  });
  it('partial paste replaces entire group and focuses next empty', () => {
    const complete = vi.fn(); render(<OtpInput defaultValue={code} onComplete={complete} />); paste(otpCells()[3], '12');
    expect(otpCells().map((cell) => cell.value)).toEqual(['1', '2', '', '', '', '']); expect(otpCells()[2]).toHaveFocus(); expect(complete).not.toHaveBeenCalled();
  });
  it.each(['012345x', '12a', '١٢٣٤٥٦'])('rejects all of disallowed paste %#', (text) => {
    const complete = vi.fn(); render(<OtpInput defaultValue={code} onComplete={complete} />); paste(otpCells()[0], text);
    expect(otpCells().map((cell) => cell.value)).toEqual(code); expect(complete).not.toHaveBeenCalled();
  });
  it('substitutes and advances, arrows/Home/End navigate; Backspace/Delete never shift digits', () => {
    render(<OtpInput defaultValue={code} />); const fields = otpCells();
    fireEvent.change(fields[0], { target: { value: '9' } }); expect(fields[1]).toHaveFocus();
    fireEvent.keyDown(fields[1], { key: 'End' }); expect(fields[5]).toHaveFocus();
    fireEvent.keyDown(fields[5], { key: 'Home' }); expect(fields[0]).toHaveFocus();
    fireEvent.keyDown(fields[0], { key: 'ArrowRight' }); expect(fields[1]).toHaveFocus();
    fireEvent.keyDown(fields[1], { key: 'ArrowLeft' }); expect(fields[0]).toHaveFocus();
    fireEvent.keyDown(fields[0], { key: 'Delete' }); expect(fields[0]).toHaveValue(''); expect(fields[1]).toHaveValue('1');
    fireEvent.keyDown(fields[1], { key: 'Backspace' }); expect(fields[1]).toHaveFocus(); expect(fields[1]).toHaveValue('');
    fireEvent.keyDown(fields[1], { key: 'Backspace' }); expect(fields[0]).toHaveFocus();
  });
  it('network error preserves code and retries once, then unavailable uses approved copy', () => {
    const retry = vi.fn(); const { rerender } = render(<OtpInput defaultValue={code} status="network-error" onRetry={retry} />);
    expect(screen.getByRole('button', { name: 'Reintentar' })).toHaveFocus();
    expect(screen.getByRole('button')).toHaveClass('hly-button--secondary', 'hly-button--md'); expect(screen.getByRole('button')).not.toHaveClass('hly-button--full');
    fireEvent.click(screen.getByRole('button')); fireEvent.click(screen.getByRole('button')); expect(retry).toHaveBeenCalledTimes(1);
    rerender(<OtpInput defaultValue={code} status="unavailable" onRetry={retry} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Este código no está disponible. Solicita otro cuando puedas.'); expect(otpCells()[0]).toBeDisabled();
  });
  it('invalid result clears/refocuses controlled positions and allows the next attempt', () => {
    function Demo() {
      const [value, setValue] = useState<OtpPositions>(code);
      return <OtpInput value={value} onChange={(next) => setValue(next.positions)} status="invalid" />;
    }
    render(<Demo />); expect(otpCells().every((cell) => cell.value === '')).toBe(true); expect(otpCells()[0]).toHaveFocus();
    fireEvent.change(otpCells()[0], { target: { value: '1' } }); expect(otpCells()[1]).toHaveFocus();
  });
  it.each(['expired', 'locked', 'cooldown'] as const)('%s clears fields, disables input and focuses summary', (status) => {
    render(<OtpInput defaultValue={code} status={status} cooldownSeconds={30} />);
    expect(otpCells().every((cell) => cell.disabled && cell.value === '')).toBe(true);
    expect(document.activeElement).toHaveClass('hly-otp__summary');
  });
  it.each(['loading', 'success'] as const)('%s preserves value and blocks changes', (status) => {
    const change = vi.fn(); render(<OtpInput defaultValue={code} status={status} onChange={change} />);
    paste(otpCells()[0], '999999'); expect(change).not.toHaveBeenCalled(); expect(otpCells().map((cell) => cell.value)).toEqual(code);
  });
  it('does not instrument OTP or invoke submit on mounting a complete value', () => {
    const completed = vi.fn(); const log = vi.spyOn(console, 'log'); const info = vi.spyOn(console, 'info');
    render(<OtpInput defaultValue={code} onComplete={completed} />); expect(completed).not.toHaveBeenCalled(); expect(log).not.toHaveBeenCalled(); expect(info).not.toHaveBeenCalled();
    log.mockRestore(); info.mockRestore();
  });
});

describe('form lifecycle regressions', () => {
  it('external phone value/ref, optional empty blur, and required empty submit', () => {
    const ref = createRef<HTMLInputElement>();
    const { rerender } = render(<PhoneInput ref={ref} label="Teléfono" value="" />);
    fireEvent.blur(ref.current!); expect(ref.current).not.toHaveAttribute('aria-invalid');
    rerender(<PhoneInput ref={ref} label="Teléfono" value="612345678" />); expect(ref.current).toHaveValue('612 345 678');
    rerender(<PhoneInput ref={ref} label="Teléfono" value="" required />); fireEvent.invalid(ref.current!);
    expect(screen.getByRole('alert')).toHaveTextContent('Introduce tu número de teléfono.');
  });
  it.each(['disabled', 'readOnly'] as const)('OTP %s blocks direct edits and paste', (flag) => {
    const change = vi.fn(); render(<OtpInput defaultValue={code} {...{ [flag]: true }} onChange={change} />);
    fireEvent.change(otpCells()[0], { target: { value: '9' } }); paste(otpCells()[0], '999999');
    expect(change).not.toHaveBeenCalled(); expect(otpCells().map((cell) => cell.value)).toEqual(code);
  });
  it('autofocus only on enabled mount, never when prop changes later', () => {
    const { rerender } = render(<OtpInput autoFocus />); expect(otpCells()[0]).toHaveFocus();
    fireEvent.focus(otpCells()[3]); otpCells()[3].focus(); rerender(<OtpInput autoFocus />); expect(otpCells()[3]).toHaveFocus();
  });
  it('controlled value changes do not autosubmit, incomplete has no joined complete code', () => {
    const change = vi.fn(); const completed = vi.fn(); const { rerender } = render(<OtpInput onChange={change} onComplete={completed} />);
    fireEvent.change(otpCells()[0], { target: { value: '0' } }); expect(change).toHaveBeenLastCalledWith({ positions: ['0', '', '', '', '', ''], completeCode: null });
    rerender(<OtpInput value={code} onChange={change} onComplete={completed} />); expect(completed).not.toHaveBeenCalled();
  });
  it('cooldown updates never create per-second live alerts', () => {
    const { rerender } = render(<OtpInput status="cooldown" cooldownSeconds={30} />);
    rerender(<OtpInput status="cooldown" cooldownSeconds={29} />); expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByText('Podrás solicitar otro código en 29 s.')).toBeInTheDocument();
  });
  it('OTP full-width composition waits and does not double submit', () => {
    const completed = vi.fn(); render(<OtpInput onComplete={completed} />);
    const first = otpCells()[0]; fireEvent.compositionStart(first); fireEvent.change(first, { target: { value: '０１２３４５' } });
    expect(completed).not.toHaveBeenCalled(); fireEvent.compositionEnd(first); expect(completed).toHaveBeenCalledTimes(1);
  });
  it('new invalid result unlocks another attempt and error text is not six alerts', () => {
    const completed = vi.fn(); const { rerender } = render(<OtpInput onComplete={completed} />); paste(otpCells()[0], '012345');
    rerender(<OtpInput status="loading" onComplete={completed} />); rerender(<OtpInput status="invalid" onComplete={completed} />);
    expect(screen.getAllByRole('alert')).toHaveLength(1); paste(otpCells()[0], '012345'); expect(completed).toHaveBeenCalledTimes(2);
  });
});
