import { Container } from "@/components/layout/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { discoveryThemes } from "@/config/discovery";

export function CategoryDiscovery() {
  return (
    <Container as="section" id="explore" className="border-t border-beige-300 py-16">
      <SectionHeading
        eyebrow="Discovery"
        title="What the marketplace will carry"
        description="These are themes, not a live catalogue. There are no products, prices, or stock counts here."
      />
      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {discoveryThemes.map((theme) => (
          <li key={theme.title} className="border border-beige-300 bg-ivory-50 p-5">
            <h3 className="font-serif text-2xl text-forest-900">{theme.title}</h3>
            <p className="mt-3 text-base leading-relaxed text-charcoal-700">{theme.text}</p>
          </li>
        ))}
      </ul>
    </Container>
  );
}
