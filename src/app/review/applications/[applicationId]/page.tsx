import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/container";
import { SubmitButton } from "@/components/auth/submit-button";
import { Field, controlClass } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { reviewApplication } from "@/features/review/actions";
import { canReviewerTransition } from "@/features/applications/transitions";
import { requireReviewer } from "@/features/auth/session";

export const metadata: Metadata = { title: "Review an application" };

export default async function ReviewApplicationPage({
  params,
  searchParams,
}: {
  params: Promise<{ applicationId: string }>;
  searchParams: Promise<{ error?: string; status?: string }>;
}) {
  const { applicationId } = await params;
  const query = await searchParams;
  const { supabase, reviewer, unavailable } = await requireReviewer();
  if (unavailable) {
    return (
      <Container as="section" className="py-12">
        <h1 className="font-serif text-4xl text-forest-900">Review</h1>
        <p className="mt-4 text-lg text-charcoal-700">Review is not available until the identity migration is applied.</p>
      </Container>
    );
  }
  if (!reviewer) {
    return (
      <Container as="section" className="py-12">
        <h1 className="font-serif text-4xl text-forest-900">Access denied</h1>
        <p className="mt-4 text-lg text-charcoal-700">Your account cannot review applications.</p>
      </Container>
    );
  }

  const application = await supabase.from("business_applications").select("*").eq("id", applicationId).maybeSingle();
  if (!application.data) {
    notFound();
  }
  const record = application.data;
  const [business, profile, documents, notes] = await Promise.all([
    supabase.from("businesses").select("display_name, approval_status").eq("id", record.business_id).maybeSingle(),
    supabase.from("profiles").select("full_name").eq("id", record.applicant_id).maybeSingle(),
    supabase.from("business_application_documents").select("id, file_name").eq("application_id", applicationId),
    supabase.from("business_application_internal_notes").select("id, body, created_at").eq("application_id", applicationId).order("created_at", { ascending: false }),
  ]);
  const choices = (["under_review", "information_requested", "approved", "rejected"] as const).filter((status) =>
    canReviewerTransition(record.status, status),
  );

  return (
    <Container as="section" className="py-12 md:py-16">
      <h1 className="font-serif text-4xl text-forest-900">{business.data?.display_name ?? "Application"}</h1>
      <p className="mt-3 text-base text-charcoal-700">
        Status: {record.status.replaceAll("_", " ")}. Applicant: {profile.data?.full_name ?? "Unknown"}. Business
        approval: {business.data?.approval_status ?? "unknown"}.
      </p>
      {query.status === "saved" ? <p className="mt-4 text-base text-charcoal-700">Decision recorded.</p> : null}
      {query.error ? <p className="mt-4 text-base text-danger-700">The decision could not be recorded.</p> : null}
      <dl className="mt-8 grid max-w-2xl gap-3 text-base text-charcoal-800">
        <div><dt className="font-semibold">Type</dt><dd>{record.business_kind.replaceAll("_", " ")}</dd></div>
        <div><dt className="font-semibold">Description</dt><dd>{record.description || "None"}</dd></div>
        <div><dt className="font-semibold">Email</dt><dd>{record.business_email || "None"}</dd></div>
        <div><dt className="font-semibold">Telephone</dt><dd>{record.business_phone || "None"}</dd></div>
        <div><dt className="font-semibold">Registration</dt><dd>{record.registration_standing.replaceAll("_", " ")} {record.registration_number ?? ""}</dd></div>
        <div><dt className="font-semibold">Operations</dt><dd>{record.operations_summary || record.main_offerings || "None"}</dd></div>
        <div><dt className="font-semibold">Position</dt><dd>{record.applicant_position || "None"}</dd></div>
      </dl>
      <h2 className="mt-8 font-serif text-2xl text-forest-900">Documents</h2>
      <ul className="mt-3 space-y-2">
        {(documents.data ?? []).map((document) => (
          <li key={document.id}>
            <a className="font-semibold text-forest-800" href={`/business/apply/${applicationId}/documents/${document.id}`}>{document.file_name}</a>
          </li>
        ))}
      </ul>
      {(notes.data ?? []).length > 0 ? (
        <section className="mt-8 max-w-2xl">
          <h2 className="font-serif text-2xl text-forest-900">Internal notes</h2>
          <ul className="mt-3 space-y-2">
            {(notes.data ?? []).map((note) => <li key={note.id} className="text-base text-charcoal-800">{note.body}</li>)}
          </ul>
        </section>
      ) : null}
      {choices.length > 0 ? (
        <form action={reviewApplication} className="mt-8 grid max-w-2xl gap-4">
          <input type="hidden" name="applicationId" value={applicationId} />
          <Field label="Decision">
            {({ id }) => (
              <select id={id} name="status" className={controlClass} defaultValue={choices[0]}>
                {choices.map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}
              </select>
            )}
          </Field>
          <Textarea label="Message the applicant can see" name="message" />
          <Textarea label="Internal note" name="internalNote" hint="Applicants cannot read this." />
          <SubmitButton pendingLabel="Saving">Record decision</SubmitButton>
        </form>
      ) : (
        <p className="mt-8 text-base text-charcoal-700">This application has no further reviewer actions.</p>
      )}
      <p className="mt-8">
        <Link href="/review" className="font-semibold text-forest-800">Back to the queue</Link>
      </p>
    </Container>
  );
}
