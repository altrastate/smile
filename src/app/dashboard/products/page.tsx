import type { Metadata } from "next";
import Link from "next/link";
import { SubmitButton } from "@/components/auth/submit-button";
import { ProductPhoto } from "@/features/catalogue/components";
import { setProductStatus } from "@/features/dashboard/actions";
import { canSetPublication, listingLabel, type PublicationStatus } from "@/features/dashboard/eligibility";
import { listManagedProducts, loadWorkspace, producerPageSize } from "@/features/dashboard/queries";
import { WorkspaceNotice } from "@/features/dashboard/workspace-gate";

export const metadata: Metadata = { title: "Listings" };

const filters = [
  ["all", "All"],
  ["draft", "Drafts"],
  ["unpublished", "Unpublished"],
  ["published", "Published"],
  ["archived", "Archived"],
] as const;

function listHref(q: string, label: string, page: number) {
  const search = new URLSearchParams();
  if (q) search.set("q", q);
  if (label !== "all") search.set("status", label);
  if (page > 1) search.set("page", String(page));
  const query = search.toString();
  return query ? `/dashboard/products?${query}` : "/dashboard/products";
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string; error?: string; notice?: string }>;
}) {
  const params = await searchParams;
  const workspace = await loadWorkspace();
  if (workspace.status !== "ready") {
    return null;
  }
  const q = (params.q ?? "").trim().slice(0, 80);
  const label = filters.some(([value]) => value === params.status) ? params.status ?? "all" : "all";
  const page = Number(params.page ?? "1");
  const result = await listManagedProducts(workspace.business.id, { q, label, page });
  const returnTo = listHref(q, label, Number.isInteger(page) && page > 0 ? page : 1);

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-serif text-4xl text-forest-900">Listings</h1>
        <Link href="/dashboard/products/new" className="inline-flex min-h-11 items-center bg-forest-800 px-4 font-semibold text-ivory-50">
          New listing
        </Link>
      </div>
      <div className="mt-4">
        <WorkspaceNotice code={params.error ?? params.notice} />
      </div>
      <form className="mt-6 flex flex-col gap-3 sm:flex-row" action="/dashboard/products">
        <label className="sr-only" htmlFor="listing-search">
          Search listings
        </label>
        <input
          id="listing-search"
          name="q"
          defaultValue={q}
          placeholder="Search by name"
          className="min-h-11 w-full border border-beige-300 bg-ivory-50 px-3 sm:max-w-sm"
        />
        {label !== "all" ? <input type="hidden" name="status" value={label} /> : null}
        <button type="submit" className="min-h-11 border border-forest-800 px-4 font-semibold text-forest-800">
          Search
        </button>
      </form>
      <ul className="mt-4 flex gap-2 overflow-x-auto">
        {filters.map(([value, name]) => (
          <li key={value}>
            <Link
              href={listHref(q, value, 1)}
              aria-current={label === value ? "page" : undefined}
              className={
                label === value
                  ? "inline-flex min-h-11 items-center bg-forest-800 px-3 text-sm font-semibold text-ivory-50"
                  : "inline-flex min-h-11 items-center border border-beige-300 px-3 text-sm font-semibold text-forest-800"
              }
            >
              {name}
            </Link>
          </li>
        ))}
      </ul>
      {result.status === "unavailable" ? (
        <p className="mt-6 text-charcoal-700">{result.message}</p>
      ) : result.products.length === 0 ? (
        <p className="mt-6 text-charcoal-700">No listings match this view.</p>
      ) : (
        <ul className="mt-6 divide-y divide-beige-300 border-y border-beige-300">
          {result.products.map((product) => {
            const visible = listingLabel(product.status, product.publishedAt);
            const status = product.status as PublicationStatus;
            return (
              <li key={product.id} className="grid gap-3 py-4 md:grid-cols-[72px_minmax(0,1fr)_auto] md:items-center">
                <div className="w-[72px]">
                  <ProductPhoto name={product.name} src={product.image?.src ?? null} alt={product.image?.alt ?? ""} />
                </div>
                <div className="min-w-0">
                  <Link href={`/dashboard/products/${product.id}/edit`} className="font-semibold text-forest-800">
                    {product.name}
                  </Link>
                  <p className="text-sm text-charcoal-700">
                    {product.categoryName} · {visible}
                  </p>
                  <time dateTime={product.updatedAt} className="text-sm text-charcoal-700">
                    Updated {new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(product.updatedAt))}
                  </time>
                </div>
                <div className="flex flex-wrap gap-2">
                  {canSetPublication(status, "published") ? (
                    <form action={setProductStatus}>
                      <input type="hidden" name="productId" value={product.id} />
                      <input type="hidden" name="status" value="published" />
                      <input type="hidden" name="returnTo" value={returnTo} />
                      <SubmitButton pendingLabel="Publishing">Publish</SubmitButton>
                    </form>
                  ) : null}
                  {canSetPublication(status, "draft") ? (
                    <form action={setProductStatus}>
                      <input type="hidden" name="productId" value={product.id} />
                      <input type="hidden" name="status" value="draft" />
                      <input type="hidden" name="returnTo" value={returnTo} />
                      <SubmitButton variant="secondary" pendingLabel="Saving">
                        {status === "published" ? "Unpublish" : "Restore to draft"}
                      </SubmitButton>
                    </form>
                  ) : null}
                  {canSetPublication(status, "archived") ? (
                    <form action={setProductStatus} className="flex flex-wrap items-center gap-2">
                      <input type="hidden" name="productId" value={product.id} />
                      <input type="hidden" name="status" value="archived" />
                      <input type="hidden" name="returnTo" value={returnTo} />
                      <label className="flex min-h-11 items-center gap-2 text-sm text-charcoal-700">
                        <input type="checkbox" name="confirm" />
                        Confirm archive
                      </label>
                      <SubmitButton variant="danger" pendingLabel="Archiving">
                        Archive
                      </SubmitButton>
                    </form>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {result.status === "ok" && result.total > producerPageSize ? (
        <nav aria-label="Listing pages" className="mt-6 flex gap-3">
          {page > 1 ? (
            <Link href={listHref(q, label, page - 1)} className="inline-flex min-h-11 items-center border border-beige-300 px-3 font-semibold">
              Previous
            </Link>
          ) : null}
          {page * producerPageSize < result.total ? (
            <Link href={listHref(q, label, page + 1)} className="inline-flex min-h-11 items-center border border-beige-300 px-3 font-semibold">
              Next
            </Link>
          ) : null}
        </nav>
      ) : null}
    </section>
  );
}
