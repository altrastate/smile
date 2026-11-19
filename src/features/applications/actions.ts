"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/features/auth/session";
import { businessSlug } from "@/features/applications/transitions";
import {
  detectDocumentType,
  documentObjectPath,
  isSafeDocumentPath,
  maxDocumentBytes,
  safeDocumentName,
} from "@/features/applications/documents";

const kinds = ["producer", "manufacturer", "supplier", "distributor", "retailer", "service_provider"] as const;
const standings = ["registered", "not_registered", "pending", "not_required"] as const;
const countries = ["UG", "KE", "TZ", "RW", "BI", "SS"] as const;

const draftSchema = z.object({
  businessName: z.string().trim().min(2).max(120),
  businessKind: z.enum(kinds),
  description: z.string().trim().max(2000),
  countryCode: z.union([z.literal(""), z.enum(countries)]),
  district: z.string().trim().max(80),
  city: z.string().trim().max(80),
  address: z.string().trim().max(200),
  website: z.string().trim().max(200),
  businessEmail: z.string().trim().max(160),
  businessPhone: z.string().trim().max(20),
  whatsappPhone: z.string().trim().max(20),
  registrationStanding: z.enum(standings),
  registrationAuthority: z.string().trim().max(120),
  registrationNumber: z.string().trim().max(80),
  taxIdentification: z.string().trim().max(80),
  mainOfferings: z.string().trim().max(500),
  activities: z.string().trim().max(500),
  regionsServed: z.string().trim().max(200),
  operationsSummary: z.string().trim().max(2000),
  yearsOperating: z.string().trim(),
  applicantPosition: z.string().trim().max(80),
  categoryIds: z.array(z.string().uuid()).max(12),
  authorised: z.boolean(),
  accuracy: z.boolean(),
  consent: z.boolean(),
});

const allowedBrowserTypes = new Set(["", "application/octet-stream", "application/pdf", "image/jpeg", "image/png", "image/webp"]);

function emptyToNull(value: string) {
  return value.length > 0 ? value : null;
}

function readDraft(formData: FormData) {
  const years = String(formData.get("yearsOperating") ?? "").trim();
  return draftSchema.safeParse({
    businessName: formData.get("businessName"),
    businessKind: formData.get("businessKind"),
    description: formData.get("description") ?? "",
    countryCode: formData.get("countryCode") ?? "",
    district: formData.get("district") ?? "",
    city: formData.get("city") ?? "",
    address: formData.get("address") ?? "",
    website: formData.get("website") ?? "",
    businessEmail: formData.get("businessEmail") ?? "",
    businessPhone: formData.get("businessPhone") ?? "",
    whatsappPhone: formData.get("whatsappPhone") ?? "",
    registrationStanding: formData.get("registrationStanding") ?? "not_required",
    registrationAuthority: formData.get("registrationAuthority") ?? "",
    registrationNumber: formData.get("registrationNumber") ?? "",
    taxIdentification: formData.get("taxIdentification") ?? "",
    mainOfferings: formData.get("mainOfferings") ?? "",
    activities: formData.get("activities") ?? "",
    regionsServed: formData.get("regionsServed") ?? "",
    operationsSummary: formData.get("operationsSummary") ?? "",
    yearsOperating: years,
    applicantPosition: formData.get("applicantPosition") ?? "",
    categoryIds: formData.getAll("category").map(String),
    authorised: formData.get("authorised") === "on",
    accuracy: formData.get("accuracy") === "on",
    consent: formData.get("consent") === "on",
  });
}

function applicationFields(data: z.infer<typeof draftSchema>) {
  const years = data.yearsOperating === "" ? null : Number(data.yearsOperating);
  return {
    business_kind: data.businessKind,
    description: data.description,
    country_code: emptyToNull(data.countryCode),
    district: emptyToNull(data.district),
    city: emptyToNull(data.city),
    address: emptyToNull(data.address),
    website: emptyToNull(data.website),
    business_email: emptyToNull(data.businessEmail),
    business_phone: emptyToNull(data.businessPhone),
    whatsapp_phone: emptyToNull(data.whatsappPhone),
    registration_standing: data.registrationStanding,
    registration_authority: emptyToNull(data.registrationAuthority),
    registration_number: data.registrationStanding === "registered" ? emptyToNull(data.registrationNumber) : null,
    tax_identification: emptyToNull(data.taxIdentification),
    main_offerings: emptyToNull(data.mainOfferings),
    activities: emptyToNull(data.activities),
    regions_served: emptyToNull(data.regionsServed),
    operations_summary: emptyToNull(data.operationsSummary),
    years_operating: years !== null && Number.isInteger(years) ? years : null,
    applicant_position: emptyToNull(data.applicantPosition),
    authorised_declaration: data.authorised,
    accuracy_declaration: data.accuracy,
    verification_consent: data.consent,
  };
}

function failurePath(applicationId: string, error: { message: string }) {
  if (/schema cache|does not exist|could not find|function public\.|relation/i.test(error.message)) {
    return `/business/apply/${applicationId}?error=unavailable`;
  }
  if (/incomplete|declarations|status change|cannot be edited|cannot decide/i.test(error.message)) {
    return `/business/apply/${applicationId}?error=incomplete`;
  }
  if (/not valid|not active|too many categories/i.test(error.message)) {
    return `/business/apply/${applicationId}?error=invalid`;
  }
  return `/business/apply/${applicationId}?error=save`;
}

export async function startApplication() {
  const { supabase } = await requireUser("/business/apply");
  const started = await supabase.rpc("start_business_application", { p_slug: businessSlug("New business") });
  if (started.error || !started.data) {
    redirect("/business/apply?error=unavailable");
  }
  redirect(`/business/apply/${started.data}`);
}

export async function submitApplication(formData: FormData) {
  formData.set("intent", "submit");
  return saveApplication(formData);
}

export async function saveApplication(formData: FormData) {
  const applicationId = String(formData.get("applicationId") ?? "");
  const intent = String(formData.get("intent") ?? "save");
  if (!z.string().uuid().safeParse(applicationId).success) {
    redirect("/account/applications?error=invalid");
  }

  const { supabase } = await requireUser(`/business/apply/${applicationId}`);
  const current = await supabase
    .from("business_applications")
    .select("status, business_id")
    .eq("id", applicationId)
    .maybeSingle();
  if (current.error || !current.data) {
    redirect(failurePath(applicationId, current.error ?? { message: "missing" }));
  }

  if (intent === "withdraw") {
    const withdrawn = await supabase.rpc("withdraw_business_application", { p_application_id: applicationId });
    if (withdrawn.error) {
      redirect(failurePath(applicationId, withdrawn.error));
    }
    redirect(`/business/apply/${applicationId}?status=withdrawn`);
  }

  const parsed = readDraft(formData);
  if (!parsed.success) {
    redirect(`/business/apply/${applicationId}?error=invalid`);
  }
  if (current.data.status !== "draft" && current.data.status !== "information_requested") {
    redirect(`/business/apply/${applicationId}?error=closed`);
  }

  const fields = applicationFields(parsed.data);
  if (intent === "submit") {
    const ready =
      fields.description.trim().length >= 10 &&
      fields.business_email &&
      fields.business_phone &&
      fields.applicant_position &&
      fields.authorised_declaration &&
      fields.accuracy_declaration &&
      fields.verification_consent;
    if (!ready) {
      redirect(`/business/apply/${applicationId}?error=incomplete`);
    }
  }

  const existingBusiness = await supabase
    .from("businesses")
    .select("display_name, slug")
    .eq("id", current.data.business_id)
    .maybeSingle();
  const slug =
    existingBusiness.data?.display_name === parsed.data.businessName && existingBusiness.data.slug
      ? existingBusiness.data.slug
      : businessSlug(parsed.data.businessName);
  const saved = await supabase.rpc("save_business_application", {
    p_application_id: applicationId,
    p_display_name: parsed.data.businessName,
    p_slug: slug,
    p_status: intent === "submit" ? "submitted" : current.data.status,
    p_business_kind: fields.business_kind,
    p_description: fields.description,
    p_country_code: fields.country_code ?? "",
    p_district: fields.district ?? "",
    p_city: fields.city ?? "",
    p_address: fields.address ?? "",
    p_website: fields.website ?? "",
    p_business_email: fields.business_email ?? "",
    p_business_phone: fields.business_phone ?? "",
    p_whatsapp_phone: fields.whatsapp_phone ?? "",
    p_registration_standing: fields.registration_standing,
    p_registration_authority: fields.registration_authority ?? "",
    p_registration_number: fields.registration_number ?? "",
    p_tax_identification: fields.tax_identification ?? "",
    p_main_offerings: fields.main_offerings ?? "",
    p_activities: fields.activities ?? "",
    p_regions_served: fields.regions_served ?? "",
    p_operations_summary: fields.operations_summary ?? "",
    p_years_operating: fields.years_operating,
    p_applicant_position: fields.applicant_position ?? "",
    p_authorised: fields.authorised_declaration,
    p_accuracy: fields.accuracy_declaration,
    p_consent: fields.verification_consent,
    p_category_ids: parsed.data.categoryIds,
  });
  if (saved.error) {
    redirect(failurePath(applicationId, saved.error));
  }

  if (intent === "submit") {
    redirect(`/business/application-submitted?application=${applicationId}`);
  }
  redirect(`/business/apply/${applicationId}?status=saved`);
}

export async function uploadApplicationDocument(formData: FormData) {
  const applicationId = String(formData.get("applicationId") ?? "");
  const file = formData.get("document");
  if (!(file instanceof File) || !z.uuid().safeParse(applicationId).success) {
    redirect(`/business/apply/${applicationId}?error=file`);
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const detected = detectDocumentType(bytes);
  if (!detected || bytes.byteLength === 0 || bytes.byteLength > maxDocumentBytes) {
    redirect(`/business/apply/${applicationId}?error=file`);
  }
  if (file.type && !allowedBrowserTypes.has(file.type)) {
    redirect(`/business/apply/${applicationId}?error=file`);
  }
  if (file.type && file.type !== "application/octet-stream" && file.type !== detected) {
    redirect(`/business/apply/${applicationId}?error=file`);
  }

  const { supabase, user } = await requireUser(`/business/apply/${applicationId}`);
  const path = documentObjectPath(user.id, applicationId, crypto.randomUUID(), detected);
  if (!isSafeDocumentPath(path)) {
    redirect(`/business/apply/${applicationId}?error=file`);
  }
  const uploaded = await supabase.storage.from("business-documents").upload(path, bytes, {
    contentType: detected,
    upsert: false,
  });
  if (uploaded.error) {
    redirect(`/business/apply/${applicationId}?error=file`);
  }

  const recorded = await supabase.from("business_application_documents").insert({
    application_id: applicationId,
    storage_path: path,
    file_name: safeDocumentName(file.name),
    mime_type: detected,
    size_bytes: bytes.byteLength,
    uploaded_by: user.id,
  });
  if (recorded.error) {
    const removed = await supabase.storage.from("business-documents").remove([path]);
    if (removed.error) {
      const orphan = await supabase.from("business_document_orphans").insert({
        storage_path: path,
        application_id: applicationId,
        reported_by: user.id,
        reason: "The document row was not saved and the stored object could not be removed.",
      });
      if (orphan.error) {
        console.error("document orphan was not recorded", applicationId);
      }
      redirect(`/business/apply/${applicationId}?error=orphan`);
    }
    redirect(`/business/apply/${applicationId}?error=file`);
  }
  redirect(`/business/apply/${applicationId}?status=uploaded`);
}
