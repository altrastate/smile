import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { site } from "@/config/site";
import { CatalogueUnavailable, ProductPhoto } from "@/features/catalogue/components";
import { getProduct } from "@/features/catalogue/queries";

export const dynamic = "force-dynamic";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await getProduct(slug);
  if (result.status !== "ok") {
    return { title: "Product" };
  }
  if (!result.product) {
    notFound();
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
    <Container as="section" className="section-space">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Shop", href: "/shop" },
          { label: product.categoryName, href: `/categories/${product.categorySlug}` },
          { label: product.name },
        ]}
      />
      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-12">
        <div className="photo-frame overflow-hidden border border-beige-300 bg-ivory-100 shadow-soft lg:sticky lg:top-28">
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
          <h1 className="display mt-3 text-forest-900">{product.name}</h1>
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
          <div className="mt-10 border border-beige-300 bg-ivory-100 p-5">
            <p className="font-serif text-2xl text-forest-900">Ask the showroom</p>
            <p className="mt-2 text-base leading-relaxed text-charcoal-700">
              Prices are not listed on this page. Call or write and name this pack.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-3 min-[480px]:grid-cols-2">
              <a href={site.phoneHref} className="inline-flex min-h-12 items-center justify-center border border-forest-800 bg-forest-800 px-4 text-center font-semibold text-ivory-50">
                Call {site.phone}
              </a>
              <a
                href={`mailto:${site.email}?subject=${encodeURIComponent(product.name)}`}
                className="inline-flex min-h-12 items-center justify-center border border-forest-800 bg-ivory-50 px-4 text-center font-semibold text-forest-800"
              >
                Email the showroom
              </a>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}
