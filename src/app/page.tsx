import type { Metadata } from "next";
import { BusinessParticipation } from "@/components/home/business-participation";
import { CategoryDiscovery } from "@/components/home/category-discovery";
import { ClosingCta } from "@/components/home/closing-cta";
import { EcosystemSection } from "@/components/home/ecosystem-section";
import { HeroSection } from "@/components/home/hero-section";
import { MarketplaceIntroduction } from "@/components/home/marketplace-introduction";
import { ProducerSection } from "@/components/home/producer-section";
import { TrustSection } from "@/components/home/trust-section";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: { absolute: site.name },
  description:
    "Discover natural wellness products, connect with trusted producers and suppliers, and explore opportunities across East Africa's growing nutraceutical industry.",
  openGraph: {
    title: site.name,
    description:
      "Discover natural wellness products, connect with trusted producers and suppliers, and explore opportunities across East Africa's growing nutraceutical industry.",
    siteName: site.name,
    type: "website",
    locale: "en",
  },
};

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <MarketplaceIntroduction />
      <CategoryDiscovery />
      <ProducerSection />
      <EcosystemSection />
      <TrustSection />
      <BusinessParticipation />
      <ClosingCta />
    </>
  );
}
