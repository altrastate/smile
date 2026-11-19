import { FoundationPanel } from "@/components/foundation/foundation-panel";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { EmptyState } from "@/components/ui/empty-state";
import { site } from "@/config/site";

export default function HomePage() {
  return (
    <>
      <section className="mx-auto grid max-w-6xl gap-12 px-5 py-16 md:py-24 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-7">
          <Breadcrumbs items={[{ label: "Foundation" }]} />
          <div className="mt-6">
            <Badge>Phase 01</Badge>
          </div>
          <h1 className="mt-6 max-w-3xl font-serif text-4xl leading-tight text-forest-900 md:text-6xl">
            {site.tagline}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-charcoal-700">
            {site.description} Developed by {site.developer}.
          </p>
        </div>
        <div className="lg:col-span-5">
          <EmptyState
            title="The marketplace is not open yet"
            description="Catalogue, accounts, checkout, and business tools are later phases. This release is the architecture and design foundation."
          />
        </div>
      </section>
      <FoundationPanel />
    </>
  );
}
