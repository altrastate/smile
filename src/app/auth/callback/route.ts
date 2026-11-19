import { NextResponse } from "next/server";
import { safeNextPath } from "@/features/auth/validation";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNextPath(url.searchParams.get("next"));
  if (!code) {
    return NextResponse.redirect(new URL("/verify-email?status=expired", url.origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    const target = next === "/reset-password" ? "/reset-password?error=expired" : "/verify-email?status=expired";
    return NextResponse.redirect(new URL(target, url.origin));
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
