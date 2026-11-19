import "server-only";

import { redirect } from "next/navigation";
import { hasPublicEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export async function getSessionUser() {
  if (!hasPublicEnv()) {
    return { supabase: null, user: null };
  }
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return { supabase, user: null };
  }
  return { supabase, user: data.user };
}

export async function requireUser(nextPath = "/account") {
  const session = await getSessionUser();
  if (!session.supabase || !session.user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }
  if (!session.user.email_confirmed_at) {
    redirect("/verify-email?status=pending");
  }
  return { supabase: session.supabase, user: session.user };
}

export async function requireReviewer() {
  const { supabase, user } = await requireUser("/review");
  const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
  if (error) {
    return { supabase, user, reviewer: false, unavailable: true };
  }
  const reviewer = (data ?? []).some((row) => row.role === "reviewer" || row.role === "admin");
  return { supabase, user, reviewer, unavailable: false };
}
