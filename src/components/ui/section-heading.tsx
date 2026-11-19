type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
};

export function SectionHeading({ eyebrow, title, description }: SectionHeadingProps) {
  return (
    <header className="max-w-2xl">
      {eyebrow ? (
        <p className="text-sm font-semibold tracking-[0.16em] text-botanical-700 uppercase">{eyebrow}</p>
      ) : null}
      <h2 className="display mt-3 text-forest-900">{title}</h2>
      {description ? <p className="mt-4 text-lg leading-relaxed text-charcoal-700">{description}</p> : null}
    </header>
  );
}
