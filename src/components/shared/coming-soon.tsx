import { LinkButton } from "@/components/shared/link-button";

type ComingSoonProps = {
  eyebrow?: string;
  title: string;
  description: string;
};

export function ComingSoon({ eyebrow = "Not open yet", title, description }: ComingSoonProps) {
  return (
    <section className="mx-auto w-full max-w-3xl px-5 py-20">
      <p className="text-sm font-semibold tracking-[0.16em] text-botanical-700 uppercase">{eyebrow}</p>
      <h1 className="mt-4 font-serif text-4xl text-forest-900 md:text-5xl">{title}</h1>
      <p className="mt-5 max-w-xl text-lg leading-relaxed text-charcoal-700">{description}</p>
      <div className="mt-8">
        <LinkButton href="/" tone="outline">
          Back to home
        </LinkButton>
      </div>
    </section>
  );
}
