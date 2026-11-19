import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { SubmitButton } from "@/components/auth/submit-button";
import { logoutAction } from "@/features/auth/actions";
import { requireUser } from "@/features/auth/session";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const { supabase, user } = await requireUser("/account");
  const profile = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
  const unavailable = Boolean(profile.error);

  return (
    <Container as="section" className="py-12 md:py-16">
      <h1 className="font-serif text-4xl text-forest-900">Your account</h1>
      {params.status === "password-updated" ? (
        <p className="mt-4 text-base text-charcoal-700">Your password has been updated.</p>
      ) : null}
      {unavailable ? (
        <p className="mt-6 max-w-2xl text-lg text-charcoal-700">
          You are signed in, but profiles are not available until the identity migration is applied to this database.
        </p>
      ) : (
        <p className="mt-4 max-w-2xl text-lg text-charcoal-700">
          Signed in as {profile.data?.full_name || user.email}. Email confirmation follows the address held by Supabase
          Auth{user.email_confirmed_at ? ", and this address is confirmed." : "."}
        </p>
      )}
      <ul className="mt-8 flex max-w-xl flex-col gap-3 text-base font-semibold text-forest-800">
        <li><Link href="/account/profile">Profile</Link></li>
        <li><Link href="/account/applications">Business applications</Link></li>
        <li><Link href="/business/apply">Apply for a business</Link></li>
      </ul>
      <form action={logoutAction} className="mt-8">
        <SubmitButton pendingLabel="Signing out">Log out</SubmitButton>
      </form>
    </Container>
  );
}
