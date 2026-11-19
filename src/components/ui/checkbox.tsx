import { useId, type InputHTMLAttributes } from "react";

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
  error?: string;
};

export function Checkbox({ label, error, id, ...props }: CheckboxProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const errorId = `${fieldId}-error`;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={fieldId} className="flex min-h-11 items-start gap-3 text-base text-charcoal-900">
        <input
          id={fieldId}
          type="checkbox"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="mt-1 size-4 accent-forest-800"
          {...props}
        />
        <span>{label}</span>
      </label>
      {error ? (
        <p id={errorId} className="text-sm text-danger-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
