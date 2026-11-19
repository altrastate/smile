import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import {
  CataloguePagination,
  CatalogueToolbar,
  CatalogueUnavailable,
  ProductGrid,
  ResultSummary,
} from "@/features/catalogue/components";
import { catalogueHref, parseCatalogueParams } from "@/features/catalogue/params";
import { listCategories, listProducts } from "@/features/catalogue/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shop",
  description: "Published products from approved businesses on Smile. Prices and stock are not shown yet.",
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string | string[];
    category?: string | string[];
    sort?: string | string[];
    page?: string | string[];
  }>;
}) {
  const params = parseCatalogueParams(await searchParams);
  const [products, categories] = await Promise.all([
    listProducts({ q: params.q, category: params.category, sort: params.sort, page: params.page }),
    listCategories(),
  ]);

  return (
    <Container as="section" className="section-space">
      <p className="text-sm font-semibold tracking-[0.16em] text-botanical-700 uppercase">Catalogue</p>
      <h1 className="display mt-3 text-forest-900">Shop</h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-charcoal-700">
        The house range photographed for Smile Nutraceuticals, plus any listing an approved producer has published.
        Pack sizes come from the labels. Prices are not shown.
      </p>
      <div className="mt-8">
        <CatalogueToolbar
          action="/shop"
          params={params}
          categories={categories.status === "ok" ? categories.categories : []}
        />
      </div>
      {params.q || params.category || params.sort === "name" ? (
        <p className="mt-4">
          <Link href="/shop" className="inline-flex min-h-11 items-center text-sm font-semibold text-forest-800">
            Clear filters
          </Link>
        </p>
      ) : null}
      <div className="mt-8 space-y-6">
        {categories.status === "unavailable" ? (
          <CatalogueUnavailable message={categories.message} />
        ) : products.status === "unavailable" ? (
          <CatalogueUnavailable message={products.message} />
        ) : (
          <>
            <ResultSummary
              total={products.total}
              returned={products.products.length}
              page={params.page}
              q={params.q}
              scoped={Boolean(params.category)}
              resetHref={catalogueHref("/shop", { ...params, page: 1 })}
            />
            {products.products.length > 0 ? <ProductGrid products={products.products} /> : null}
            <CataloguePagination pathname="/shop" params={params} total={products.total} />
          </>
        )}
      </div>
    </Container>
  );
}
