type LoadingStateProps = {
  label?: string;
};

export function LoadingState({ label = "Loading" }: LoadingStateProps) {
  return (
    <div role="status" className="flex items-center gap-3 text-charcoal-700">
      <span className="inline-block h-2 w-16 bg-forest-800" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
