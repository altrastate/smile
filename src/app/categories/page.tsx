import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { CatalogueUnavailable } from "@/features/catalogue/components";
import { listCategories } from "@/features/catalogue/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Categories",
  description: "Catalogue categories for Smile Nutraceuticals.",
};

export default async function CategoriesPage() {
  const result = await listCategories();

  return (
    <Container as="section" className="py-12 md:py-16">
      <p className="text-sm font-semibold tracking-[0.16em] text-botanical-700 uppercase">Catalogue</p>
      <h1 className="mt-3 font-serif text-4xl text-forest-900 md:text-5xl">Categories</h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-charcoal-700">
        These are the categories products can belong to. A category page shows published products in that category.
      </p>
      <div className="mt-8">
        {result.status === "unavailable" ? (
          <CatalogueUnavailable message={result.message} />
        ) : result.categories.length === 0 ? (
          <p className="text-base text-charcoal-700">No active categories are available.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {result.categories
              .filter((category) => category.parentId === null)
              .map((category) => {
                const children = result.categories.filter((item) => item.parentId === category.id);
                return (
                  <li key={category.id} className="border border-beige-300 bg-ivory-50">
                    <Link href={`/categories/${category.slug}`} className="block min-h-11 p-5">
                      <h2 className="font-serif text-2xl text-forest-900">{category.name}</h2>
                      <p className="mt-3 text-base leading-relaxed text-charcoal-700">{category.description}</p>
                    </Link>
                    {children.length > 0 ? (
                      <ul className="border-t border-beige-300 px-5 py-3">
                        {children.map((child) => (
                          <li key={child.id}>
                            <Link
                              href={`/categories/${child.slug}`}
                              className="inline-flex min-h-11 items-center text-sm font-semibold text-forest-800"
                            >
                              {child.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                );
              })}
          </ul>
        )}
      </div>
    </Container>
  );
}
