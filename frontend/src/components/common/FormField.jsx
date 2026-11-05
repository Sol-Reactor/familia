import { forwardRef, useId, useState, cloneElement, isValidElement } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { cn } from '../../lib/utils';

/**
 * Label + control + hint/error, wired up with the right aria attributes.
 * Pass the control as the only child, or use the default <Input>.
 */
export function FormField({ label, hint, error, children, className, id: idProp, required, ...inputProps }) {
  const autoId = useId();
  const id = idProp || autoId;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;

  const controlProps = {
    id,
    required,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': describedBy,
  };

  const control = isValidElement(children)
    ? cloneElement(children, { ...controlProps, ...children.props, id })
    : <Input {...inputProps} {...controlProps} />;

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label htmlFor={id}>
          {label}
          {required && <span className="ml-0.5 text-destructive" aria-hidden="true">*</span>}
        </Label>
      )}
      {control}
      {error ? (
        <p id={errorId} className="flex items-start gap-1.5 text-sm font-medium text-destructive" role="alert">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

/** Password input with a show/hide toggle */
export const PasswordInput = forwardRef(({ className, ...props }, ref) => {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input
        ref={ref}
        type={visible ? 'text' : 'password'}
        className={cn('pr-12', className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-1 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
      >
        {visible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
      </button>
    </div>
  );
});
PasswordInput.displayName = 'PasswordInput';

/** Inline alert box for form-level messages */
export function FormAlert({ type = 'error', children }) {
  if (!children) return null;
  const styles = type === 'success'
    ? 'border-success/30 bg-success/10 text-success'
    : 'border-destructive/30 bg-destructive/10 text-destructive';
  return (
    <div className={cn('flex items-start gap-2 rounded-lg border px-4 py-3 text-sm font-medium', styles)} role={type === 'error' ? 'alert' : 'status'}>
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

/** Mirrors the backend password policy for live feedback */
export function getPasswordIssues(password) {
  const issues = [];
  if (password.length < 8) issues.push('at least 8 characters');
  if (!/[A-Za-z]/.test(password)) issues.push('a letter');
  if (!/\d/.test(password)) issues.push('a number');
  return issues;
}
