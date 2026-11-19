import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="border border-beige-300 bg-ivory-100 px-6 py-8">
      <h2 className="font-serif text-2xl text-forest-900">{title}</h2>
      <p className="mt-3 max-w-md text-base leading-relaxed text-charcoal-700">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
