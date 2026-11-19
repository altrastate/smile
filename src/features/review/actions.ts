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

  const { supabase, reviewer, unavailable } = await requireReviewer();
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

  const saved = await supabase.rpc("decide_business_application", {
    p_application_id: parsed.data.applicationId,
    p_status: parsed.data.status,
    p_message: parsed.data.message,
    p_internal_note: parsed.data.internalNote,
  });
  if (saved.error) {
    redirect(`/review/applications/${parsed.data.applicationId}?error=save`);
  }

  redirect(`/review/applications/${parsed.data.applicationId}?status=saved`);
}
