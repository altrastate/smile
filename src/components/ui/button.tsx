import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const variants = {
  primary: "border border-forest-800 bg-forest-800 text-ivory-50 hover:bg-forest-700",
  secondary: "border border-forest-800 bg-ivory-50 text-forest-800 hover:bg-ivory-100",
  ghost: "border border-transparent bg-transparent text-forest-800 hover:bg-beige-200",
  danger: "border border-danger-700 bg-ivory-50 text-danger-700 hover:bg-ivory-100",
} as const;

const sizes = {
  md: "min-h-11 px-4 text-base",
  sm: "min-h-10 px-3 text-sm",
} as const;

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", className, type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
});
