import type { SelectHTMLAttributes } from "react";
import { Field, controlClass } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type SelectOption = {
  value: string;
  label: string;
};

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  hint?: string;
  error?: string;
  options: readonly SelectOption[];
  placeholder?: string;
};

export function Select({ label, hint, error, options, placeholder, className, id, ...props }: SelectProps) {
  return (
    <Field id={id} label={label} hint={hint} error={error}>
      {({ id, describedBy }) => (
        <select
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(controlClass, error && "border-danger-700", className)}
          {...props}
        >
          <option value="">{placeholder ?? "Select"}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
}
