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
    <Container as="section" className="section-space">
      <p className="text-sm font-semibold tracking-[0.16em] text-botanical-700 uppercase">{site.market}</p>
      <h1 className="display mt-4 max-w-3xl text-forest-900">About {site.name}</h1>
      <div className="mt-8 max-w-2xl space-y-5 text-lg leading-relaxed text-charcoal-700">
        <p>
          {site.name} is a marketplace for natural and nutraceutical products. It is being built to connect
          producers, manufacturers, suppliers, distributors, service providers, and buyers in {site.market}.
        </p>
        <p>{site.tagline}.</p>
        <p>
          The shop shows the photographed Smile house range, and published products from approved businesses
          when those exist. Pack details come from the labels. Prices, stock, and checkout are not part of
          this showing. Accounts and business applications are open.
        </p>
        <p>Developed by {site.developer}.</p>
      </div>
    </Container>
  );
}
