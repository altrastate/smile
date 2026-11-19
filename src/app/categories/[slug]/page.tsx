import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import {
  CataloguePagination,
  CatalogueToolbar,
  CatalogueUnavailable,
  ProductGrid,
  ResultSummary,
} from "@/features/catalogue/components";
import { catalogueHref, parseCatalogueParams } from "@/features/catalogue/params";
import { getCategory, listCategories, listProducts } from "@/features/catalogue/queries";

export const dynamic = "force-dynamic";

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    q?: string | string[];
    sort?: string | string[];
    page?: string | string[];
  }>;
};

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await getCategory(slug);
  if (result.status !== "ok") {
    return { title: "Category" };
  }
  if (!result.category) {
    notFound();
  }
  return {
    title: result.category.name,
    description: result.category.description,
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const parsed = parseCatalogueParams(await searchParams);
  const categoryResult = await getCategory(slug);

  if (categoryResult.status === "unavailable") {
    return (
      <Container as="section" className="py-16">
        <CatalogueUnavailable message={categoryResult.message} />
      </Container>
    );
  }

  if (!categoryResult.category) {
    notFound();
  }

  const category = categoryResult.category;
  const filters = { ...parsed, category: category.slug };
  const [products, categories] = await Promise.all([
    listProducts({ q: filters.q, category: category.slug, sort: filters.sort, page: filters.page }),
    listCategories(),
  ]);

  return (
    <Container as="section" className="py-12 md:py-16">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Categories", href: "/categories" },
          { label: category.name },
        ]}
      />
      <h1 className="mt-6 font-serif text-4xl text-forest-900 md:text-5xl">{category.name}</h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-charcoal-700">{category.description}</p>
      <div className="mt-8">
        {categories.status === "ok" ? (
          <CatalogueToolbar action={`/categories/${category.slug}`} params={filters} categories={categories.categories} lockCategory />
        ) : (
          <CatalogueUnavailable message={categories.message} />
        )}
      </div>
      {filters.q || filters.sort === "name" ? (
        <p className="mt-4">
          <Link href={`/categories/${category.slug}`} className="inline-flex min-h-11 items-center text-sm font-semibold text-forest-800">
            Clear search
          </Link>
        </p>
      ) : null}
      <div className="mt-8 space-y-6">
        {products.status === "unavailable" ? (
          <CatalogueUnavailable message={products.message} />
        ) : (
          <>
            <ResultSummary
              total={products.total}
              returned={products.products.length}
              page={filters.page}
              q={filters.q}
              scoped
              resetHref={catalogueHref(`/categories/${category.slug}`, { ...filters, page: 1 })}
            />
            {products.products.length > 0 ? <ProductGrid products={products.products} /> : null}
            <CataloguePagination pathname={`/categories/${category.slug}`} params={filters} total={products.total} />
          </>
        )}
      </div>
    </Container>
  );
}
