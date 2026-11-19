import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { SubmitButton } from "@/components/auth/submit-button";
import { startApplication } from "@/features/applications/actions";
import { requireUser } from "@/features/auth/session";

export const metadata: Metadata = { title: "Your applications" };

const labels: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under review",
  information_requested: "More information requested",
  approved: "Approved",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

export default async function ApplicationsPage() {
  const { supabase } = await requireUser("/account/applications");
  const applications = await supabase
    .from("business_applications")
    .select("id, status, business_kind, updated_at, business_id")
    .order("updated_at", { ascending: false });

  const businessIds = (applications.data ?? []).map((item) => item.business_id);
  const businesses = businessIds.length
    ? await supabase.from("businesses").select("id, display_name").in("id", businessIds)
    : { data: [], error: null };

  return (
    <Container as="section" className="py-12 md:py-16">
      <h1 className="font-serif text-4xl text-forest-900">Business applications</h1>
      {applications.error ? (
        <p className="mt-6 max-w-2xl text-lg text-charcoal-700">
          Applications are not available until the identity migration is applied.
        </p>
      ) : applications.data.length === 0 ? (
        <p className="mt-6 max-w-2xl text-lg text-charcoal-700">You have not started an application.</p>
      ) : (
        <ul className="mt-8 divide-y divide-beige-300 border-y border-beige-300">
          {applications.data.map((item) => {
            const name = businesses.data?.find((business) => business.id === item.business_id)?.display_name ?? "Business";
            return (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div>
                  <p className="font-semibold text-charcoal-900">{name}</p>
                  <p className="text-sm text-charcoal-700">{labels[item.status] ?? item.status}</p>
                </div>
                <Link href={`/business/apply/${item.id}`} className="font-semibold text-forest-800">Open</Link>
              </li>
            );
          })}
        </ul>
      )}
      <form action={startApplication} className="mt-8">
        <SubmitButton pendingLabel="Starting">Start an application</SubmitButton>
      </form>
    </Container>
  );
}
