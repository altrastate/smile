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
    <Container as="section" className="reveal section-space border-t border-beige-300">
      <SectionHeading
        eyebrow="The marketplace"
        title="One place for the natural-products trade"
        description="Smile connects the people who make, supply, move, and buy natural and nutraceutical goods."
      />
      <ul className="mt-10 grid grid-cols-1 gap-3 min-[540px]:grid-cols-2 min-[1100px]:grid-cols-3">
        {parties.map((party) => (
          <li key={party} className="border border-beige-300 px-4 py-4 text-base font-semibold text-forest-800">
            {party}
          </li>
        ))}
      </ul>
    </Container>
  );
}
