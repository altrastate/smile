import { Container } from "@/components/layout/container";
import { SectionHeading } from "@/components/ui/section-heading";

const parties = [
  "Manufacturers",
  "Organic producers",
  "Suppliers",
  "Distributors",
  "Service providers",
  "Consumers and business buyers",
];

export function MarketplaceIntroduction() {
  return (
    <Container as="section" className="border-t border-beige-300 py-16">
      <SectionHeading
        eyebrow="The marketplace"
        title="One place for the natural-products trade"
        description="Smile connects the people who make, supply, move, and buy natural and nutraceutical goods."
      />
      <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {parties.map((party) => (
          <li key={party} className="border border-beige-300 px-4 py-4 text-base font-semibold text-forest-800">
            {party}
          </li>
        ))}
      </ul>
    </Container>
  );
}
