import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { CatalogueUnavailable, ProductPhoto } from "@/features/catalogue/components";
import { getProduct } from "@/features/catalogue/queries";

export const dynamic = "force-dynamic";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await getProduct(slug);
  if (result.status !== "ok" || !result.product) {
    return { title: "Product" };
  }
  const description = result.product.summary ?? result.product.description ?? undefined;
  return {
    title: result.product.name,
    description,
    openGraph: description
      ? { title: result.product.name, description, siteName: "Smile Nutraceuticals" }
      : { title: result.product.name, siteName: "Smile Nutraceuticals" },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const result = await getProduct(slug);

  if (result.status === "unavailable") {
    return (
      <Container as="section" className="py-16">
        <CatalogueUnavailable message={result.message} />
      </Container>
    );
  }

  if (!result.product) {
    notFound();
  }

  const product = result.product;
  const facts = [
    product.productType ? { label: "Type", value: product.productType } : null,
    product.brandName ? { label: "Brand", value: product.brandName } : null,
    product.manufacturerName ? { label: "Manufacturer", value: product.manufacturerName } : null,
    product.origin ? { label: "Origin", value: product.origin } : null,
  ].filter((fact) => fact !== null);

  return (
    <Container as="section" className="py-12 md:py-16">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Shop", href: "/shop" },
          { label: product.categoryName, href: `/categories/${product.categorySlug}` },
          { label: product.name },
        ]}
      />
      <div className="mt-8 grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <ProductPhoto name={product.name} src={product.image.src} alt={product.image.alt} />
          {product.images.length > 1 ? (
            <ul className="mt-3 grid grid-cols-4 gap-3">
              {product.images.map((image) => (
                <li key={image.src}>
                  <ProductPhoto name={product.name} src={image.src} alt={image.alt} />
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div>
          <p className="text-sm font-semibold text-botanical-700">{product.categoryName}</p>
          <h1 className="mt-3 font-serif text-4xl text-forest-900 md:text-5xl">{product.name}</h1>
          <p className="mt-4 text-base text-charcoal-700">
            <Link href={`/businesses/${product.businessSlug}`} className="font-semibold text-forest-800">
              {product.businessName}
            </Link>
          </p>
          {product.summary ? <p className="mt-6 text-lg leading-relaxed text-charcoal-700">{product.summary}</p> : null}
          {product.description ? (
            <div className="mt-6">
              <h2 className="font-serif text-2xl text-forest-900">Description</h2>
              <p className="mt-3 whitespace-pre-line text-base leading-relaxed text-charcoal-700">{product.description}</p>
            </div>
          ) : null}
          {product.ingredients ? (
            <div className="mt-6">
              <h2 className="font-serif text-2xl text-forest-900">Ingredients</h2>
              <p className="mt-3 whitespace-pre-line text-base leading-relaxed text-charcoal-700">{product.ingredients}</p>
            </div>
          ) : null}
          {facts.length > 0 ? (
            <dl className="mt-8 grid gap-4 sm:grid-cols-2">
              {facts.map((fact) => (
                <div key={fact.label} className="border-t border-beige-300 pt-3">
                  <dt className="text-sm font-semibold text-forest-800">{fact.label}</dt>
                  <dd className="mt-1 text-base text-charcoal-900">{fact.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      </div>
    </Container>
  );
}
