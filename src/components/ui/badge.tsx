import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const tones = {
  forest: "border-forest-800 text-forest-800",
  clay: "border-clay-700 text-clay-700",
  neutral: "border-beige-300 text-charcoal-700",
} as const;

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: keyof typeof tones;
};

export function Badge({ tone = "forest", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center border bg-ivory-50 px-2 py-1 text-xs font-semibold uppercase tracking-[0.12em]",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
