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
      <h2 className="mt-3 font-serif text-3xl text-forest-900 md:text-4xl">{title}</h2>
      {description ? <p className="mt-4 text-lg leading-relaxed text-charcoal-700">{description}</p> : null}
    </header>
  );
}
