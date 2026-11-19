import type { Metadata } from "next";
import Link from "next/link";
import { listingLabel } from "@/features/dashboard/eligibility";
import { loadWorkspace, productCounts, recentProducts } from "@/features/dashboard/queries";
import { storefrontCompletion } from "@/features/dashboard/eligibility";
import { kindLabel, WorkspaceNotice } from "@/features/dashboard/workspace-gate";

export const metadata: Metadata = { title: "Producer workspace" };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; status?: string }>;
}) {
  const params = await searchParams;
  const workspace = await loadWorkspace();
  if (workspace.status !== "ready") {
    return null;
  }
  const business = workspace.business;
  const counts = await productCounts(business.id);
  const recent = await recentProducts(business.id);
  const completion = storefrontCompletion({
    description: business.description,
    countryCode: business.countryCode,
    city: business.city,
    website: business.website,
  });

  return (
    <section>
      <h1 className="font-serif text-4xl text-forest-900">Overview</h1>
      <div className="mt-4">
        <WorkspaceNotice code={params.error ?? params.status} />
      </div>
      <p className="mt-4 max-w-2xl text-lg text-charcoal-700">
        {business.name} is an approved {kindLabel(business.kind).toLowerCase()}. Approval does not publish listings.
      </p>
      <dl className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[
          ["Storefront details", `${completion.filled} of ${completion.total}`],
          ["Listings", String(counts.total)],
          ["Published", String(counts.published)],
          ["Drafts", String(counts.drafts)],
          ["Unpublished", String(counts.unpublished)],
          ["Archived", String(counts.archived)],
        ].map(([label, value]) => (
          <div key={label} className="border border-beige-300 bg-ivory-100 px-4 py-3">
            <dt className="text-sm font-semibold text-charcoal-700">{label}</dt>
            <dd className="mt-1 font-serif text-3xl text-forest-900">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/dashboard/products/new" className="inline-flex min-h-11 items-center bg-forest-800 px-4 font-semibold text-ivory-50">
          New listing
        </Link>
        <Link href={`/businesses/${business.slug}`} className="inline-flex min-h-11 items-center border border-forest-800 px-4 font-semibold text-forest-800">
          Public storefront
        </Link>
      </div>
      <h2 className="mt-10 font-serif text-2xl text-forest-900">Recent listings</h2>
      {recent.length === 0 ? (
        <p className="mt-3 text-charcoal-700">No listings yet.</p>
      ) : (
        <ul className="mt-4 divide-y divide-beige-300 border-y border-beige-300">
          {recent.map((product) => (
            <li key={product.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div>
                <Link href={`/dashboard/products/${product.id}/edit`} className="font-semibold text-forest-800">
                  {product.name}
                </Link>
                <p className="text-sm text-charcoal-700">{listingLabel(product.status, product.publishedAt)}</p>
              </div>
              <time dateTime={product.updatedAt} className="text-sm text-charcoal-700">
                {new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(product.updatedAt))}
              </time>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
