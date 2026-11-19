import Image from "next/image";
import { Container } from "@/components/layout/container";
import { LinkButton } from "@/components/shared/link-button";

export function HeroSection() {
  return (
    <Container as="section" className="grid items-center gap-10 py-14 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
      <div>
        <p className="text-sm font-semibold tracking-[0.16em] text-botanical-700 uppercase">East Africa</p>
        <h1 className="mt-4 max-w-xl font-serif text-5xl leading-tight text-forest-900 md:text-6xl">
          Nature&apos;s goodness. Connected.
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-charcoal-700">
          Discover natural wellness products, connect with trusted producers and suppliers, and explore
          opportunities across East Africa&apos;s growing nutraceutical industry.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <LinkButton href="/shop">Explore the marketplace</LinkButton>
          <LinkButton href="/#participate" tone="outline">
            Join as a business
          </LinkButton>
        </div>
      </div>
      <div className="border border-beige-300 bg-ivory-100">
        <Image
          src="/brand/canopy.svg"
          alt="A line drawing of leaves on a stem."
          width={640}
          height={720}
          priority
          unoptimized
          className="h-auto w-full"
        />
      </div>
    </Container>
  );
}
