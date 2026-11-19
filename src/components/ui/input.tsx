import { useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type FieldProps = {
  id?: string;
  label: string;
  hint?: string;
  error?: string;
  children: (ids: { id: string; describedBy?: string }) => ReactNode;
};

export function Field({ id, label, hint, error, children }: FieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={fieldId} className="text-sm font-semibold text-charcoal-900">
        {label}
      </label>
      {children({ id: fieldId, describedBy })}
      {hint ? (
        <p id={hintId} className="text-sm text-charcoal-700">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-sm text-danger-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}

const controlClass =
  "min-h-11 w-full rounded-sm border border-beige-300 bg-ivory-50 px-3 text-base text-charcoal-900 placeholder:text-charcoal-500";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
};

export function Input({ label, hint, error, className, id, ...props }: InputProps) {
  return (
    <Field id={id} label={label} hint={hint} error={error}>
      {({ id, describedBy }) => (
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(controlClass, error && "border-danger-700", className)}
          {...props}
        />
      )}
    </Field>
  );
}

export { controlClass };
