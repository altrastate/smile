"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireReviewer } from "@/features/auth/session";
import { canReviewerTransition } from "@/features/applications/transitions";

const decisionSchema = z.object({
  applicationId: z.string().uuid(),
  status: z.enum(["under_review", "information_requested", "approved", "rejected"]),
  message: z.string().trim().max(2000),
  internalNote: z.string().trim().max(2000),
});

export async function reviewApplication(formData: FormData) {
  const parsed = decisionSchema.safeParse({
    applicationId: formData.get("applicationId"),
    status: formData.get("status"),
    message: formData.get("message") ?? "",
    internalNote: formData.get("internalNote") ?? "",
  });
  if (!parsed.success) {
    redirect("/review?error=invalid");
  }

  const { supabase, user, reviewer, unavailable } = await requireReviewer();
  if (unavailable) {
    redirect("/review?error=unavailable");
  }
  if (!reviewer) {
    redirect("/review?error=denied");
  }

  const current = await supabase
    .from("business_applications")
    .select("status")
    .eq("id", parsed.data.applicationId)
    .maybeSingle();
  if (!current.data || !canReviewerTransition(current.data.status, parsed.data.status)) {
    redirect(`/review/applications/${parsed.data.applicationId}?error=status`);
  }

  if (parsed.data.internalNote) {
    const note = await supabase.from("business_application_internal_notes").insert({
      application_id: parsed.data.applicationId,
      author_id: user.id,
      body: parsed.data.internalNote,
    });
    if (note.error) {
      redirect(`/review/applications/${parsed.data.applicationId}?error=save`);
    }
  }

  const saved = await supabase
    .from("business_applications")
    .update({
      status: parsed.data.status,
      applicant_visible_message: parsed.data.message || null,
    })
    .eq("id", parsed.data.applicationId);
  if (saved.error) {
    redirect(`/review/applications/${parsed.data.applicationId}?error=save`);
  }

  redirect(`/review/applications/${parsed.data.applicationId}?status=saved`);
}
