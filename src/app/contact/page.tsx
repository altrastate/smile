import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { LinkButton } from "@/components/shared/link-button";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Showroom, telephone, and email for Smile Nutraceuticals in Kampala.",
  openGraph: {
    title: `Contact · ${site.name}`,
    description: "Showroom, telephone, and email for Smile Nutraceuticals in Kampala.",
    siteName: site.name,
    type: "website",
    locale: "en",
  },
};

export default function ContactPage() {
  return (
    <>
    <section className="bg-forest-950 text-ivory-50">
      <Container className="section-space">
        <p className="text-sm font-semibold tracking-[0.18em] text-beige-200 uppercase">Showroom</p>
        <h1 className="display-xl mt-4 max-w-3xl text-ivory-50">Visit Smile in Kampala</h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-beige-200">
          The showroom is on Kyebando Ring Road, next to Handsome Petrol Station. Call or write before you come, and
          ask for the pack you saw in the catalogue.
        </p>
      </Container>
    </section>
    <Container as="section" className="section-space">
      <dl className="grid grid-cols-1 gap-4 min-[800px]:grid-cols-3">
        <div className="border border-beige-300 bg-ivory-100 p-6">
          <dt className="text-sm font-semibold tracking-[0.14em] text-botanical-700 uppercase">Address</dt>
          <dd className="mt-3 font-serif text-[clamp(1.35rem,1rem+1vw,1.75rem)] leading-snug text-forest-900">{site.address}</dd>
        </div>
        <div className="border border-beige-300 bg-ivory-100 p-6">
          <dt className="text-sm font-semibold tracking-[0.14em] text-botanical-700 uppercase">Telephone</dt>
          <dd className="mt-3">
            <a href={site.phoneHref} className="font-serif text-[clamp(1.35rem,1rem+1vw,1.75rem)] text-forest-900">
              {site.phone}
            </a>
          </dd>
        </div>
        <div className="border border-beige-300 bg-ivory-100 p-6">
          <dt className="text-sm font-semibold tracking-[0.14em] text-botanical-700 uppercase">Email</dt>
          <dd className="mt-3 break-all">
            <a href={`mailto:${site.email}`} className="font-serif text-[clamp(1.15rem,0.8rem+1vw,1.6rem)] break-words text-forest-900">
              {site.email}
            </a>
          </dd>
        </div>
      </dl>
      <div className="mt-8">
        <LinkButton href="/shop">Browse the catalogue</LinkButton>
      </div>
      <p className="mt-10 text-base text-charcoal-700">Developed by {site.developer}.</p>
    </Container>
    </>
  );
}
