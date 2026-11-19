import { Container } from "@/components/layout/container";
import { SectionHeading } from "@/components/ui/section-heading";

export function TrustSection() {
  return (
    <Container as="section" className="reveal section-space border-t border-beige-300">
      <SectionHeading
        eyebrow="Trust"
        title="Verification is a process, not a claim"
        description="Smile intends to review business accounts before they trade on the platform. That review is not the same as regulatory approval of a product."
      />
      <div className="mt-10 grid grid-cols-1 gap-4 min-[720px]:grid-cols-3">
        <article className="border border-beige-300 p-5">
          <h3 className="font-serif text-2xl text-forest-900">Business accounts</h3>
          <p className="mt-3 text-base leading-relaxed text-charcoal-700">
            A signed-in person can apply for a business. A reviewer decides whether it is approved.
            The house range on this showing belongs to Smile Nutraceuticals.
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
            Businesses will be expected to describe their goods accurately. The house packs on this showing
            are photographed from their labels. A producer listing appears only after it is published and the
            business is approved.
          </p>
        </article>
      </div>
    </Container>
  );
}
