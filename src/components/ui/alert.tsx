import { cn } from "@/lib/utils";

const tones = {
  info: "border-forest-800 text-forest-900",
  success: "border-botanical-700 text-forest-900",
  warning: "border-warning-800 text-warning-800",
  danger: "border-danger-700 text-danger-700",
} as const;

type AlertProps = {
  tone?: keyof typeof tones;
  title: string;
  children?: string;
};

export function Alert({ tone = "info", title, children }: AlertProps) {
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={cn("border-l-4 bg-ivory-100 px-4 py-3", tones[tone])}>
      <p className="font-semibold">{title}</p>
      {children ? <p className="mt-1 text-charcoal-700">{children}</p> : null}
    </div>
  );
}
