import Link from "next/link";
import { Container } from "@/components/layout/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { discoveryThemes } from "@/config/discovery";

export function CategoryDiscovery() {
  return (
    <Container as="section" id="explore" className="reveal section-space border-t border-beige-300">
      <SectionHeading
        eyebrow="Discovery"
        title="Browse by what the pack is for"
        description="Open a category to see the photographed packs that belong there. Prices are not shown."
      />
      <ul className="mt-10 grid grid-cols-1 gap-4 min-[540px]:grid-cols-2 min-[1100px]:grid-cols-3">
        {discoveryThemes.map((theme) => (
          <li key={theme.slug} className="lift border border-beige-300 bg-ivory-50">
            <Link href={`/categories/${theme.slug}`} className="block min-h-11 p-5">
              <h3 className="font-serif text-2xl text-forest-900">{theme.title}</h3>
              <p className="mt-3 text-base leading-relaxed text-charcoal-700">{theme.text}</p>
            </Link>
          </li>
        ))}
      </ul>
    </Container>
  );
}
