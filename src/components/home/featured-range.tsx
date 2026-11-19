import Link from "next/link";
import { Container } from "@/components/layout/container";
import { ProductGrid } from "@/features/catalogue/components";
import { filterShowcase } from "@/features/catalogue/showcase";

export function FeaturedRange() {
  const products = filterShowcase({ sort: "newest" }).slice(0, 6);
  return (
    <Container as="section" className="section-space">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold tracking-[0.16em] text-botanical-700 uppercase">House range</p>
          <h2 className="display mt-3 text-forest-900">Photographed for the showroom</h2>
        </div>
        <Link href="/shop" className="inline-flex min-h-11 items-center text-sm font-semibold text-forest-800">
          See the full catalogue
        </Link>
      </div>
      <div className="mt-8">
        <ProductGrid products={products} />
      </div>
    </Container>
  );
}
