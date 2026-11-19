import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const tones = {
  solid: "border border-forest-800 bg-forest-800 text-ivory-50 hover:bg-forest-700",
  outline: "border border-forest-800 bg-ivory-50 text-forest-800 hover:bg-ivory-100",
  inverse: "border border-ivory-50 text-ivory-50 hover:bg-forest-700",
} as const;

type LinkButtonProps = {
  href: string;
  children: ReactNode;
  tone?: keyof typeof tones;
  className?: string;
};

export function LinkButton({ href, children, tone = "solid", className }: LinkButtonProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex min-h-12 items-center justify-center px-5 font-semibold",
        tones[tone],
        className,
      )}
    >
      {children}
    </Link>
  );
}
