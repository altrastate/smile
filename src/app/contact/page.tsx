import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact channels for Smile Nutraceuticals are being prepared.",
  openGraph: {
    title: `Contact · ${site.name}`,
    description: "Contact channels for Smile Nutraceuticals are being prepared.",
    siteName: site.name,
    type: "website",
    locale: "en",
  },
};

export default function ContactPage() {
  return (
    <Container as="section" className="py-16 md:py-20">
      <p className="text-sm font-semibold tracking-[0.16em] text-botanical-700 uppercase">Support</p>
      <h1 className="mt-4 font-serif text-4xl text-forest-900 md:text-5xl">Contact</h1>
      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-charcoal-700">
        Public contact channels are being prepared. This page will list a confirmed address, telephone
        number, or email when one has been supplied. None is published yet.
      </p>
      <p className="mt-4 text-base text-charcoal-700">Developed by {site.developer}.</p>
    </Container>
  );
}
