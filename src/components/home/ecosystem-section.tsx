import { Container } from "@/components/layout/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { ecosystemRoles } from "@/config/discovery";

export function EcosystemSection() {
  return (
    <Container as="section" className="reveal section-space border-t border-beige-300">
      <SectionHeading
        eyebrow="The ecosystem"
        title="More than a shop window"
        description="Each role depends on the others. Smile is the shared place where those relationships can be visible."
      />
      <ol className="mt-10 grid grid-cols-1 gap-px bg-beige-300 min-[540px]:grid-cols-2 min-[1100px]:grid-cols-3">
        {ecosystemRoles.map((role, index) => (
          <li key={role.title} className="bg-ivory-50 p-5">
            <p className="text-sm font-semibold text-clay-700">0{index + 1}</p>
            <h3 className="mt-2 font-serif text-2xl text-forest-900">{role.title}</h3>
            <p className="mt-2 text-base leading-relaxed text-charcoal-700">{role.text}</p>
          </li>
        ))}
      </ol>
    </Container>
  );
}
