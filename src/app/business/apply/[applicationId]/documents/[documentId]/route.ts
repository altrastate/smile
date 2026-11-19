import { NextResponse } from "next/server";
import { requireUser } from "@/features/auth/session";

export async function GET(
  _request: Request,
  context: { params: Promise<{ applicationId: string; documentId: string }> },
) {
  const { applicationId, documentId } = await context.params;
  const { supabase } = await requireUser(`/business/apply/${applicationId}`);
  const document = await supabase
    .from("business_application_documents")
    .select("storage_path")
    .eq("id", documentId)
    .eq("application_id", applicationId)
    .maybeSingle();
  if (!document.data) {
    return new NextResponse("Not found", { status: 404 });
  }

  const signed = await supabase.storage.from("business-documents").createSignedUrl(document.data.storage_path, 60);
  if (signed.error || !signed.data?.signedUrl) {
    return new NextResponse("Not found", { status: 404 });
  }
  return NextResponse.redirect(signed.data.signedUrl);
}
