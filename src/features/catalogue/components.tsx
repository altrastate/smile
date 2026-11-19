import Link from "next/link";
import Image from "next/image";
import { ProductCard } from "@/components/ui/product-card";
import type { CatalogueCategory } from "@/features/catalogue/queries";
import { pageSize, type CatalogueProduct } from "@/features/catalogue/queries";
import { catalogueHref, type CatalogueParams } from "@/features/catalogue/params";
import { cataloguePageState } from "@/features/catalogue/search";
import { Alert } from "@/components/ui/alert";

export function CatalogueUnavailable({ message }: { message: string }) {
  return <Alert tone="warning" title={message} />;
}

export function ProductPhoto({ name, src, alt }: { name: string; src: string | null; alt: string }) {
  if (!src) {
    return (
      <div className="flex aspect-square items-center justify-center border border-beige-300 bg-beige-200 text-forest-800">
        <span className="font-serif text-5xl" aria-hidden="true">
          {name.slice(0, 1)}
        </span>
        <span className="sr-only">{name} has no photograph.</span>
      </div>
    );
  }

  return (
    <div className="relative aspect-[4/5] border border-beige-300 bg-ivory-100 sm:aspect-square">
      <Image
        src={src}
        alt={alt || name}
        fill
        quality={90}
        sizes="(min-width: 1024px) 42vw, 100vw"
        className="object-contain p-4 sm:p-6"
      />
    </div>
  );
}

export function ProductGrid({ products }: { products: CatalogueProduct[] }) {
  return (
    <ul className="reveal-children grid grid-cols-1 gap-4 min-[540px]:grid-cols-2 min-[1100px]:grid-cols-3 sm:gap-6">
      {products.map((product) => (
        <li key={product.id}>
          <ProductCard
            name={product.name}
            href={`/shop/${product.slug}`}
            imageSrc={product.image.src}
            imageAlt={product.image.alt}
            category={product.categoryName}
            business={product.businessName}
            summary={product.summary ?? undefined}
          />
        </li>
      ))}
    </ul>
  );
}

export function CatalogueToolbar({
  action,
  params,
  categories,
  lockCategory = false,
}: {
  action: string;
  params: CatalogueParams;
  categories: CatalogueCategory[];
  lockCategory?: boolean;
}) {
  return (
    <form
      key={`${params.q}|${params.category}|${params.sort}|${lockCategory ? "locked" : "open"}`}
      action={action}
      method="get"
      className={`grid gap-3 border border-beige-300 bg-ivory-100 p-4 md:items-end ${lockCategory ? "md:grid-cols-[1.4fr_auto_auto]" : "md:grid-cols-[1.4fr_1fr_auto_auto]"}`}
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="catalogue-q" className="text-sm font-semibold text-forest-800">
          Search products
        </label>
        <input
          id="catalogue-q"
          name="q"
          type="search"
          defaultValue={params.q}
          className="min-h-11 border border-beige-300 bg-ivory-50 px-3 text-base text-charcoal-900"
        />
      </div>
      {lockCategory ? (
        <input type="hidden" name="category" value={params.category} />
      ) : (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="catalogue-category" className="text-sm font-semibold text-forest-800">
            Category
          </label>
          <select
            id="catalogue-category"
            name="category"
            defaultValue={params.category}
            className="min-h-11 border border-beige-300 bg-ivory-50 px-3 text-base text-charcoal-900"
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="catalogue-sort" className="text-sm font-semibold text-forest-800">
          Sort
        </label>
        <select
          id="catalogue-sort"
          name="sort"
          defaultValue={params.sort}
          className="min-h-11 border border-beige-300 bg-ivory-50 px-3 text-base text-charcoal-900"
        >
          <option value="newest">Newest</option>
          <option value="name">Alphabetical</option>
        </select>
      </div>
      <button type="submit" className="min-h-11 border border-forest-800 bg-forest-800 px-4 font-semibold text-ivory-50">
        Apply
      </button>
    </form>
  );
}

export function CataloguePagination({
  pathname,
  params,
  total,
}: {
  pathname: string;
  params: CatalogueParams;
  total: number;
}) {
  const { pageCount, outOfRange } = cataloguePageState(total, params.page, pageSize);
  if (pageCount <= 1 || outOfRange) {
    return null;
  }

  const previous = params.page > 1 ? catalogueHref(pathname, { ...params, page: params.page - 1 }) : undefined;
  const next = params.page < pageCount ? catalogueHref(pathname, { ...params, page: params.page + 1 }) : undefined;

  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center gap-2">
      {previous ? (
        <Link href={previous} className="inline-flex min-h-11 items-center border border-beige-300 px-3">
          Previous
        </Link>
      ) : (
        <span className="inline-flex min-h-11 items-center border border-beige-300 px-3 opacity-40">Previous</span>
      )}
      <p className="px-2 text-sm text-charcoal-700">
        Page {params.page} of {pageCount}
      </p>
      {next ? (
        <Link href={next} className="inline-flex min-h-11 items-center border border-beige-300 px-3">
          Next
        </Link>
      ) : (
        <span className="inline-flex min-h-11 items-center border border-beige-300 px-3 opacity-40">Next</span>
      )}
    </nav>
  );
}

export function ResultSummary({
  total,
  returned,
  page,
  q,
  scoped,
  resetHref,
}: {
  total: number;
  returned: number;
  page: number;
  q: string;
  scoped: boolean;
  resetHref: string;
}) {
  if (returned === 0 && cataloguePageState(total, page, pageSize).outOfRange) {
    return (
      <p className="text-base text-charcoal-700">
        This page is outside the results.{" "}
        <Link href={resetHref} className="font-semibold text-forest-800">
          Back to the first page
        </Link>
      </p>
    );
  }
  if (total === 0 && q) {
    return <p className="text-base text-charcoal-700">No published products match “{q}”.</p>;
  }
  if (total === 0 && scoped) {
    return <p className="text-base text-charcoal-700">This category has no published products yet.</p>;
  }
  if (total === 0) {
    return (
      <p className="text-base text-charcoal-700">
        No published products are in the catalogue yet. Categories are ready for products from approved businesses.
      </p>
    );
  }
  const label = total === 1 ? "published product" : "published products";
  return (
    <p className="text-base text-charcoal-700">
      {total} {label}
      {q ? ` matching “${q}”` : ""}.
    </p>
  );
}
