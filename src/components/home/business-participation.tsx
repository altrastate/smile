import { Container } from "@/components/layout/container";
import { LinkButton } from "@/components/shared/link-button";
import { SectionHeading } from "@/components/ui/section-heading";

export function BusinessParticipation() {
  return (
    <Container as="section" id="participate" className="reveal section-space border-t border-beige-300">
      <SectionHeading
        eyebrow="Take part"
        title="Apply for a business"
        description="Producers, manufacturers, suppliers, distributors, retailers, and service providers can apply with an account. Submitting an application does not approve the business or publish any products."
      />
      <ul className="mt-8 max-w-2xl space-y-3 text-base leading-relaxed text-charcoal-700">
        <li>Describe the business and the role it plays.</li>
        <li>A reviewer decides the application before the business can take part.</li>
        <li>Create an account, then save a draft and submit it when it is complete.</li>
      </ul>
      <div className="mt-8">
        <LinkButton href="/business/apply" tone="outline">
          Start an application
        </LinkButton>
      </div>
    </Container>
  );
}
