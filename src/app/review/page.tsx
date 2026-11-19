import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { requireReviewer } from "@/features/auth/session";

export const metadata: Metadata = { title: "Review applications" };

const labels: Record<string, string> = {
  submitted: "Submitted",
  under_review: "Under review",
  information_requested: "More information requested",
};

export default async function ReviewQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const { supabase, reviewer, unavailable } = await requireReviewer();

  if (unavailable) {
    return (
      <Container as="section" className="py-12">
        <h1 className="font-serif text-4xl text-forest-900">Review</h1>
        <p className="mt-4 max-w-2xl text-lg text-charcoal-700">
          Review is not available until the identity migration is applied.
        </p>
      </Container>
    );
  }
  if (!reviewer) {
    return (
      <Container as="section" className="py-12">
        <h1 className="font-serif text-4xl text-forest-900">Access denied</h1>
        <p className="mt-4 max-w-2xl text-lg text-charcoal-700">
          Your account does not have the reviewer role. Accounts cannot grant that role to themselves.
        </p>
      </Container>
    );
  }

  const applications = await supabase
    .from("business_applications")
    .select("id, status, business_id, submitted_at")
    .in("status", ["submitted", "under_review", "information_requested"])
    .order("submitted_at", { ascending: true });
  const ids = (applications.data ?? []).map((item) => item.business_id);
  const businesses = ids.length
    ? await supabase.from("businesses").select("id, display_name").in("id", ids)
    : { data: [] };

  return (
    <Container as="section" className="py-12 md:py-16">
      <h1 className="font-serif text-4xl text-forest-900">Applications to review</h1>
      {params.error === "denied" ? <p className="mt-4 text-base text-danger-700">That action was not permitted.</p> : null}
      {(applications.data ?? []).length === 0 ? (
        <p className="mt-6 text-lg text-charcoal-700">There are no applications waiting.</p>
      ) : (
        <ul className="mt-8 divide-y divide-beige-300 border-y border-beige-300">
          {(applications.data ?? []).map((item) => (
            <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div>
                <p className="font-semibold text-charcoal-900">
                  {businesses.data?.find((business) => business.id === item.business_id)?.display_name ?? "Business"}
                </p>
                <p className="text-sm text-charcoal-700">{labels[item.status] ?? item.status}</p>
              </div>
              <Link href={`/review/applications/${item.id}`} className="font-semibold text-forest-800">Review</Link>
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
