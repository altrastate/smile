import { Container } from "@/components/layout/container";
import { SectionHeading } from "@/components/ui/section-heading";

export function TrustSection() {
  return (
    <Container as="section" className="border-t border-beige-300 py-16">
      <SectionHeading
        eyebrow="Trust"
        title="Verification is a process, not a claim"
        description="Smile intends to review business accounts before they trade on the platform. That review is not the same as regulatory approval of a product."
      />
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        <article className="border border-beige-300 p-5">
          <h3 className="font-serif text-2xl text-forest-900">Business accounts</h3>
          <p className="mt-3 text-base leading-relaxed text-charcoal-700">
            A later phase will ask businesses to apply, and an administrator will decide whether the account
            can participate. No business has been verified on this site yet.
          </p>
        </article>
        <article className="border border-beige-300 p-5">
          <h3 className="font-serif text-2xl text-forest-900">Product information</h3>
          <p className="mt-3 text-base leading-relaxed text-charcoal-700">
            Published products will show the information the business provides. Smile does not approve a
            product for medical use, and does not guarantee that a product is safe or effective.
          </p>
        </article>
        <article className="border border-beige-300 p-5">
          <h3 className="font-serif text-2xl text-forest-900">Participation</h3>
          <p className="mt-3 text-base leading-relaxed text-charcoal-700">
            Businesses will be expected to describe their goods accurately. The catalogue that will hold
            those records is not open yet.
          </p>
        </article>
      </div>
    </Container>
  );
}
