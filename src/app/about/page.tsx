import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: "About",
  description: "What Smile Nutraceuticals is, and what is not live yet.",
  openGraph: {
    title: `About · ${site.name}`,
    description: "What Smile Nutraceuticals is, and what is not live yet.",
    siteName: site.name,
    type: "website",
    locale: "en",
  },
};

export default function AboutPage() {
  return (
    <Container as="section" className="py-16 md:py-20">
      <p className="text-sm font-semibold tracking-[0.16em] text-botanical-700 uppercase">{site.market}</p>
      <h1 className="mt-4 max-w-3xl font-serif text-4xl text-forest-900 md:text-5xl">About {site.name}</h1>
      <div className="mt-8 max-w-2xl space-y-5 text-lg leading-relaxed text-charcoal-700">
        <p>
          {site.name} is a marketplace for natural and nutraceutical products. It is being built to connect
          producers, manufacturers, suppliers, distributors, service providers, and buyers in {site.market}.
        </p>
        <p>{site.tagline}.</p>
        <p>
          The public site currently explains the marketplace. The catalogue, accounts, applications, and
          checkout are not open.
        </p>
        <p>Developed by {site.developer}.</p>
      </div>
    </Container>
  );
}
