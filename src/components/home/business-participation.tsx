import { Container } from "@/components/layout/container";
import { LinkButton } from "@/components/shared/link-button";
import { SectionHeading } from "@/components/ui/section-heading";

export function BusinessParticipation() {
  return (
    <Container as="section" id="participate" className="border-t border-beige-300 py-16">
      <SectionHeading
        eyebrow="Take part"
        title="Business onboarding comes next"
        description="Producers, manufacturers, suppliers, distributors, and service providers will be able to apply for an account. Applications are not open on this site yet."
      />
      <ul className="mt-8 max-w-2xl space-y-3 text-base leading-relaxed text-charcoal-700">
        <li>You will describe the business and the role it plays.</li>
        <li>An administrator will review the application before the account can trade.</li>
        <li>There is no registration form in this release.</li>
      </ul>
      <div className="mt-8">
        <LinkButton href="/contact" tone="outline">
          See the contact status
        </LinkButton>
      </div>
    </Container>
  );
}
