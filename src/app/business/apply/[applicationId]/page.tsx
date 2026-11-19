import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/container";
import { SubmitButton } from "@/components/auth/submit-button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Field, controlClass } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { saveApplication, uploadApplicationDocument } from "@/features/applications/actions";
import { requireUser } from "@/features/auth/session";

export const metadata: Metadata = { title: "Business application" };

const kinds = [
  ["producer", "Producer / grower"],
  ["manufacturer", "Manufacturer / processor"],
  ["supplier", "Supplier"],
  ["distributor", "Distributor / wholesaler"],
  ["retailer", "Retailer"],
  ["service_provider", "Service provider"],
] as const;

const standings = [
  ["not_required", "Registration is not required for this business"],
  ["not_registered", "Not registered"],
  ["pending", "Registration is in progress"],
  ["registered", "Registered"],
] as const;

const countries = [
  ["UG", "Uganda"],
  ["KE", "Kenya"],
  ["TZ", "Tanzania"],
  ["RW", "Rwanda"],
  ["BI", "Burundi"],
  ["SS", "South Sudan"],
] as const;

const statusLabel: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under review",
  information_requested: "More information requested",
  approved: "Approved",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

const notices: Record<string, string> = {
  invalid: "Check the form. Names need at least two characters, and years must be a whole number if you enter them.",
  incomplete: "Before submitting, add a description of at least 10 characters, a business email, a telephone number, your position, and all three declarations.",
  unavailable: "This application could not be saved because the identity tables are not available.",
  save: "The application could not be saved.",
  closed: "This application can no longer be edited.",
  file: "Upload a PDF, JPEG, PNG, or WebP file of 10 MB or less. The file contents must match that format.",
  orphan: "The document was not saved. Removal of the stored file also failed, so it was recorded for recovery.",
  saved: "Draft saved.",
  uploaded: "Document uploaded.",
  withdrawn: "Application withdrawn.",
};

export default async function ApplicationEditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ applicationId: string }>;
  searchParams: Promise<{ error?: string; status?: string }>;
}) {
  const { applicationId } = await params;
  const query = await searchParams;
  const { supabase, user } = await requireUser(`/business/apply/${applicationId}`);
  const application = await supabase.from("business_applications").select("*").eq("id", applicationId).maybeSingle();
  if (application.error) {
    return (
      <Container as="section" className="py-12">
        <h1 className="font-serif text-4xl text-forest-900">Application</h1>
        <p className="mt-4 max-w-2xl text-lg text-charcoal-700">
          Applications are not available until the identity migration is applied.
        </p>
      </Container>
    );
  }
  if (!application.data || application.data.applicant_id !== user.id) {
    notFound();
  }

  const record = application.data;
  const open = record.status === "draft" || record.status === "information_requested";
  const [business, categories, selected, documents, events] = await Promise.all([
    supabase.from("businesses").select("display_name").eq("id", record.business_id).maybeSingle(),
    supabase.from("categories").select("id, name").eq("is_active", true).order("display_order"),
    supabase.from("business_application_categories").select("category_id").eq("application_id", applicationId),
    supabase.from("business_application_documents").select("id, file_name, mime_type, size_bytes").eq("application_id", applicationId),
    supabase.from("business_application_events").select("id, event, applicant_message, created_at").eq("application_id", applicationId).order("created_at", { ascending: false }),
  ]);
  const selectedIds = new Set((selected.data ?? []).map((item) => item.category_id));
  const feedback =
    record.applicant_visible_message ??
    (events.data ?? []).find((event) => event.applicant_message)?.applicant_message;
  const notice = notices[query.error ?? ""] ?? notices[query.status ?? ""];

  return (
    <Container as="section" className="py-12 md:py-16">
      <p className="text-sm font-semibold uppercase tracking-wide text-forest-800">{statusLabel[record.status] ?? record.status}</p>
      <h1 className="mt-2 font-serif text-4xl text-forest-900">{business.data?.display_name || "Business application"}</h1>
      {feedback ? (
        <p className="mt-4 max-w-2xl border border-beige-300 bg-beige-200 p-4 text-base text-charcoal-900">
          {feedback}
        </p>
      ) : null}
      {notice ? <p className="mt-4 max-w-2xl text-base text-charcoal-700">{notice}</p> : null}

      <form action={saveApplication} className="mt-8 grid max-w-2xl gap-8">
        <input type="hidden" name="applicationId" value={applicationId} />
        <fieldset className="grid gap-4" disabled={!open}>
          <legend className="font-serif text-2xl text-forest-900">Business identity</legend>
          <Input label="Business name" name="businessName" defaultValue={business.data?.display_name === "New business" ? "" : business.data?.display_name ?? ""} required />
          <Field label="Business type">
            {({ id }) => (
              <select id={id} name="businessKind" defaultValue={record.business_kind} className={controlClass}>
                {kinds.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            )}
          </Field>
          <Textarea label="Description" name="description" defaultValue={record.description} hint="At least 10 characters before you submit." />
          <Field label="Country">
            {({ id }) => (
              <select id={id} name="countryCode" defaultValue={record.country_code ?? ""} className={controlClass}>
                <option value="">Not stated</option>
                {countries.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
              </select>
            )}
          </Field>
          <Input label="District or region" name="district" defaultValue={record.district ?? ""} />
          <Input label="City or town" name="city" defaultValue={record.city ?? ""} />
          <Input label="Physical address" name="address" defaultValue={record.address ?? ""} />
          <Input label="Website, if you have one" name="website" defaultValue={record.website ?? ""} />
          <Input label="Business email" name="businessEmail" type="email" defaultValue={record.business_email ?? ""} />
          <Input label="Business telephone" name="businessPhone" defaultValue={record.business_phone ?? ""} />
          <Input label="WhatsApp, optional" name="whatsappPhone" defaultValue={record.whatsapp_phone ?? ""} />
        </fieldset>

        <fieldset className="grid gap-4" disabled={!open}>
          <legend className="font-serif text-2xl text-forest-900">Registration</legend>
          <Field label="Registration status">
            {({ id }) => (
              <select id={id} name="registrationStanding" defaultValue={record.registration_standing} className={controlClass}>
                {standings.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            )}
          </Field>
          <Input label="Registration authority" name="registrationAuthority" defaultValue={record.registration_authority ?? ""} />
          <Input label="Registration number, if you have one" name="registrationNumber" defaultValue={record.registration_number ?? ""} />
          <Input label="Tax identification, if applicable" name="taxIdentification" defaultValue={record.tax_identification ?? ""} />
        </fieldset>

        <fieldset className="grid gap-4" disabled={!open}>
          <legend className="font-serif text-2xl text-forest-900">Operations</legend>
          <Input label="Main products or services" name="mainOfferings" defaultValue={record.main_offerings ?? ""} />
          <Input label="Primary activities" name="activities" defaultValue={record.activities ?? ""} />
          <Input label="Countries or regions served" name="regionsServed" defaultValue={record.regions_served ?? ""} />
          <Textarea label="How the business operates" name="operationsSummary" defaultValue={record.operations_summary ?? ""} />
          <Input label="Years operating, if known" name="yearsOperating" inputMode="numeric" defaultValue={record.years_operating ?? ""} />
          <fieldset className="grid gap-2">
            <legend className="text-sm font-semibold text-charcoal-900">Relevant categories</legend>
            {(categories.data ?? []).map((category) => (
              <label key={category.id} className="flex min-h-11 items-center gap-3 text-base">
                <input type="checkbox" name="category" value={category.id} defaultChecked={selectedIds.has(category.id)} className="size-4 accent-forest-800" />
                {category.name}
              </label>
            ))}
          </fieldset>
        </fieldset>

        <fieldset className="grid gap-4" disabled={!open}>
          <legend className="font-serif text-2xl text-forest-900">Declaration</legend>
          <p className="text-base text-charcoal-700">You are submitting this as {user.email}. You cannot assign it to someone else.</p>
          <Input label="Your position or relationship to the business" name="applicantPosition" defaultValue={record.applicant_position ?? ""} />
          <Checkbox name="authorised" defaultChecked={record.authorised_declaration} label="I am authorised to submit this application." />
          <Checkbox name="accuracy" defaultChecked={record.accuracy_declaration} label="The information in this application is accurate." />
          <Checkbox name="consent" defaultChecked={record.verification_consent} label="I consent to Smile reviewing this application and the documents I upload." />
        </fieldset>

        {open ? (
          <div className="flex flex-wrap gap-3">
            <SubmitButton pendingLabel="Saving">Save draft</SubmitButton>
            <button formAction={saveApplication} name="intent" value="submit" className="inline-flex min-h-11 items-center border border-forest-800 bg-forest-800 px-4 text-sm font-semibold text-ivory-50">
              Submit application
            </button>
          </div>
        ) : null}
      </form>

      {["draft", "submitted", "information_requested"].includes(record.status) ? (
        <form action={saveApplication} className="mt-4">
          <input type="hidden" name="applicationId" value={applicationId} />
          <input type="hidden" name="intent" value="withdraw" />
          <SubmitButton pendingLabel="Withdrawing">Withdraw application</SubmitButton>
        </form>
      ) : null}

      <section className="mt-10 max-w-2xl">
        <h2 className="font-serif text-2xl text-forest-900">Documents</h2>
        <p className="mt-2 text-base text-charcoal-700">PDF, JPEG, PNG, or WebP. 10 MB maximum. These files stay private.</p>
        <ul className="mt-4 space-y-2">
          {(documents.data ?? []).map((document) => (
            <li key={document.id}>
              <a className="font-semibold text-forest-800" href={`/business/apply/${applicationId}/documents/${document.id}`}>
                {document.file_name}
              </a>
              <span className="ml-2 text-sm text-charcoal-700">{Math.ceil(document.size_bytes / 1024)} KB</span>
            </li>
          ))}
        </ul>
        {open ? (
          <form action={uploadApplicationDocument} className="mt-4 grid gap-3">
            <input type="hidden" name="applicationId" value={applicationId} />
            <Input label="Add a document" name="document" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" />
            <SubmitButton pendingLabel="Uploading">Upload</SubmitButton>
          </form>
        ) : null}
      </section>

      <section className="mt-10 max-w-2xl">
        <h2 className="font-serif text-2xl text-forest-900">History</h2>
        {(events.data ?? []).length === 0 ? (
          <p className="mt-2 text-base text-charcoal-700">No status changes yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {(events.data ?? []).map((event) => (
              <li key={event.id} className="border-b border-beige-300 pb-3">
                <p className="font-semibold text-charcoal-900">{event.event.replaceAll("_", " ")}</p>
                {event.applicant_message ? <p className="text-base text-charcoal-700">{event.applicant_message}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </section>
      <p className="mt-8">
        <Link href="/account/applications" className="font-semibold text-forest-800">All applications</Link>
      </p>
    </Container>
  );
}
