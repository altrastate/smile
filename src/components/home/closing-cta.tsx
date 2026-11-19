import { Container } from "@/components/layout/container";
import { LinkButton } from "@/components/shared/link-button";

export function ClosingCta() {
  return (
    <section className="bg-forest-800 text-ivory-50">
      <Container className="py-16 md:py-20">
        <p className="text-sm font-semibold tracking-[0.16em] text-beige-200 uppercase">Smile</p>
        <h2 className="mt-4 max-w-2xl font-serif text-4xl leading-tight md:text-5xl">
          The trade in natural goods, brought into one place.
        </h2>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <LinkButton href="/shop" tone="inverse">
            Explore the marketplace
          </LinkButton>
          <LinkButton href="/about" tone="inverse">
            About Smile
          </LinkButton>
        </div>
      </Container>
    </section>
  );
}
