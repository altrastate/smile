import { Container } from "@/components/layout/container";
import { LinkButton } from "@/components/shared/link-button";
import { site } from "@/config/site";

export function ClosingCta() {
  return (
    <section className="reveal bg-forest-800 text-ivory-50">
      <Container className="section-space">
        <p className="text-sm font-semibold tracking-[0.16em] text-beige-200 uppercase">Smile</p>
        <h2 className="display mt-4 max-w-3xl">
          The trade in natural goods, brought into one place.
        </h2>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-beige-200">{site.address}</p>
        <div className="mt-8 grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 min-[900px]:flex">
          <LinkButton href="/shop" tone="inverse" className="w-full min-[900px]:w-auto">
            Explore the marketplace
          </LinkButton>
          <a
            href={site.phoneHref}
            className="inline-flex min-h-12 w-full items-center justify-center border border-ivory-50 px-5 font-semibold text-ivory-50 min-[900px]:w-auto"
          >
            Call the showroom
          </a>
        </div>
      </Container>
    </section>
  );
}
