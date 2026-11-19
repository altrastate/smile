import { Container } from "@/components/layout/container";
import { LinkButton } from "@/components/shared/link-button";
import { SectionHeading } from "@/components/ui/section-heading";

const intentions = [
  "Present their products.",
  "Establish a digital storefront.",
  "Reach buyers.",
  "Share business information.",
  "Participate in regional trade.",
  "Build relationships with suppliers and distributors.",
];

export function ProducerSection() {
  return (
    <Container as="section" className="reveal section-space border-t border-beige-300">
      <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <SectionHeading
          eyebrow="Producers and manufacturers"
          title="A place to be found"
          description="Smile is being built so producers and manufacturers can show their work to buyers across the region."
        />
        <div>
          <ul className="space-y-3">
            {intentions.map((item) => (
              <li key={item} className="border-l-2 border-botanical-700 py-2 pl-4 text-base text-charcoal-900">
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <LinkButton href="/#participate" tone="outline">
              See how to take part
            </LinkButton>
          </div>
        </div>
      </div>
    </Container>
  );
}
