import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { showcaseBusiness } from "@/features/catalogue/showcase";

export const metadata: Metadata = {
  title: "Businesses",
  description: "The Smile Nutraceuticals showroom, and where approved businesses will be listed.",
};

export default function BusinessesPage() {
  return (
    <Container as="section" className="section-space">
      <p className="text-sm font-semibold tracking-[0.16em] text-botanical-700 uppercase">Showroom</p>
      <h1 className="display mt-4 text-forest-900">Businesses</h1>
      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-charcoal-700">
        Approved producers appear here as they publish. The house showroom is open for this demonstration.
      </p>
      <Link
        href={`/businesses/${showcaseBusiness.slug}`}
        className="lift mt-8 block max-w-2xl border border-beige-300 bg-ivory-100 p-6"
      >
        <p className="text-sm font-semibold tracking-[0.14em] text-botanical-700 uppercase">House range</p>
        <h2 className="mt-3 font-serif text-3xl text-forest-900">{showcaseBusiness.name}</h2>
        <p className="mt-3 text-base leading-relaxed text-charcoal-700">{showcaseBusiness.location}</p>
        <p className="mt-4 text-sm font-semibold text-forest-800">Open the showroom</p>
      </Link>
    </Container>
  );
}
