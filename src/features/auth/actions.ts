"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import {
  authFailureMessage,
  forgotPasswordSchema,
  fullNameSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  safeNextPath,
} from "@/features/auth/validation";
import { requireUser } from "@/features/auth/session";

async function origin() {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const protocol = headerStore.get("x-forwarded-proto") ?? "http";
  return host ? `${protocol}://${host}` : "http://127.0.0.1:3000";
}

export async function registerAction(formData: FormData) {
  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    terms: formData.get("terms"),
  });
  if (!parsed.success) {
    redirect("/register?error=invalid");
  }

  const supabase = await createClient();
  const site = await origin();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${site}/auth/callback?next=/account`,
      data: { full_name: parsed.data.fullName, terms_accepted: "true" },
    },
  });

  if (error) {
    redirect(`/register?error=${encodeURIComponent(authFailureMessage(error.message))}`);
  }

  if (!data.session) {
    redirect("/verify-email?status=sent");
  }

  redirect("/account");
}

export async function loginAction(formData: FormData) {
  const nextPath = safeNextPath(String(formData.get("next") ?? ""));
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    redirect(`/login?error=invalid&next=${encodeURIComponent(nextPath)}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    const message = authFailureMessage(error.message);
    if (message.startsWith("Confirm your email")) {
      redirect("/verify-email?status=pending");
    }
    redirect(`/login?error=${encodeURIComponent(message)}&next=${encodeURIComponent(nextPath)}`);
  }

  redirect(nextPath);
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function forgotPasswordAction(formData: FormData) {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    redirect("/forgot-password?error=invalid");
  }

  const supabase = await createClient();
  const site = await origin();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${site}/auth/callback?next=/reset-password`,
  });
  if (error) {
    redirect(`/forgot-password?error=${encodeURIComponent(authFailureMessage(error.message))}`);
  }
  redirect("/forgot-password?status=sent");
}

export async function resetPasswordAction(formData: FormData) {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    redirect("/reset-password?error=invalid");
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    redirect("/reset-password?error=expired");
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    redirect(`/reset-password?error=${encodeURIComponent(authFailureMessage(error.message))}`);
  }
  redirect("/account?status=password-updated");
}

const countries = ["UG", "KE", "TZ", "RW", "BI", "SS"] as const;

export async function updateProfileAction(formData: FormData) {
  const parsed = z
    .object({
      fullName: fullNameSchema,
      phone: z.string().trim().max(20),
      countryCode: z.union([z.literal(""), z.enum(countries)]),
    })
    .safeParse({
      fullName: formData.get("fullName"),
      phone: formData.get("phone") ?? "",
      countryCode: formData.get("countryCode") ?? "",
    });
  if (!parsed.success) {
    redirect("/account/profile?error=invalid");
  }

  const { supabase, user } = await requireUser("/account/profile");
  const saved = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      phone: parsed.data.phone || null,
      country_code: parsed.data.countryCode || null,
    })
    .eq("id", user.id);
  if (saved.error) {
    redirect("/account/profile?error=unavailable");
  }
  redirect("/account/profile?status=saved");
}
