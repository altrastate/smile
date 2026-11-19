import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ProductGrid } from "@/features/catalogue/components";
import { CatalogueUnavailable } from "@/features/catalogue/components";
import { getPublicStorefront } from "@/features/catalogue/queries";

export const dynamic = "force-dynamic";

type StorefrontPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: StorefrontPageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await getPublicStorefront(slug);
  if (result.status !== "ok" || !result.business) {
    return { title: "Business" };
  }
  return {
    title: result.business.name,
    description: result.business.description ?? `${result.business.name} on Smile Nutraceuticals.`,
  };
}

export default async function PublicStorefrontPage({ params }: StorefrontPageProps) {
  const { slug } = await params;
  const result = await getPublicStorefront(slug);
  if (result.status === "unavailable") {
    return (
      <Container as="section" className="py-16">
        <CatalogueUnavailable message={result.message} />
      </Container>
    );
  }
  if (!result.business) {
    notFound();
  }
  const business = result.business;

  return (
    <Container as="section" className="py-12 md:py-16">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: business.name }]} />
      <h1 className="mt-8 font-serif text-4xl text-forest-900 md:text-5xl">{business.name}</h1>
      {business.location ? <p className="mt-3 text-charcoal-700">{business.location}</p> : null}
      {business.description ? <p className="mt-6 max-w-3xl text-lg text-charcoal-900">{business.description}</p> : null}
      {business.website ? (
        <p className="mt-4">
          <a href={business.website} className="font-semibold text-forest-800" rel="noopener noreferrer">
            Website
          </a>
        </p>
      ) : null}
      <h2 className="mt-12 font-serif text-3xl text-forest-900">Published listings</h2>
      {business.products.length === 0 ? (
        <p className="mt-4 text-charcoal-700">No published listings.</p>
      ) : (
        <div className="mt-6">
          <ProductGrid products={business.products} />
          {business.productTotal > business.products.length ? (
            <p className="mt-6 text-charcoal-700">
              Showing {business.products.length} of {business.productTotal}.{" "}
              <Link href="/shop" className="font-semibold text-forest-800">
                Browse the shop
              </Link>
            </p>
          ) : null}
        </div>
      )}
    </Container>
  );
}
