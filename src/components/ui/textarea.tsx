import type { TextareaHTMLAttributes } from "react";
import { Field, controlClass } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  hint?: string;
  error?: string;
};

export function Textarea({ label, hint, error, className, id, ...props }: TextareaProps) {
  return (
    <Field id={id} label={label} hint={hint} error={error}>
      {({ id, describedBy }) => (
        <textarea
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(controlClass, "min-h-28 py-2", error && "border-danger-700", className)}
          {...props}
        />
      )}
    </Field>
  );
}
