import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { SubmitButton } from "@/components/auth/submit-button";
import { Input } from "@/components/ui/input";
import { Field, controlClass } from "@/components/ui/input";
import { updateProfileAction } from "@/features/auth/actions";
import { requireUser } from "@/features/auth/session";

export const metadata: Metadata = { title: "Profile" };

const countries = [
  ["UG", "Uganda"],
  ["KE", "Kenya"],
  ["TZ", "Tanzania"],
  ["RW", "Rwanda"],
  ["BI", "Burundi"],
  ["SS", "South Sudan"],
] as const;

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; status?: string }>;
}) {
  const params = await searchParams;
  const { supabase, user } = await requireUser("/account/profile");
  const profile = await supabase.from("profiles").select("full_name, phone, country_code").eq("id", user.id).maybeSingle();

  return (
    <Container as="section" className="py-12 md:py-16">
      <h1 className="font-serif text-4xl text-forest-900">Profile</h1>
      <p className="mt-4 max-w-2xl text-lg text-charcoal-700">
        Your email is {user.email}. It is managed by Supabase Auth and is not edited here.
      </p>
      {profile.error ? (
        <p className="mt-6 max-w-2xl text-base text-charcoal-700">
          Profiles are not available until the identity migration is applied.
        </p>
      ) : (
        <form action={updateProfileAction} className="mt-8 grid max-w-xl gap-4">
          {params.status === "saved" ? <p className="text-base text-charcoal-700">Profile saved.</p> : null}
          {params.error ? <p className="text-base text-danger-700">The profile could not be saved. Check the name and try again.</p> : null}
          <Input label="Full name" name="fullName" defaultValue={profile.data?.full_name ?? ""} required />
          <Input label="Phone, optional" name="phone" defaultValue={profile.data?.phone ?? ""} autoComplete="tel" />
          <Field label="Country, optional">
            {({ id }) => (
              <select id={id} name="countryCode" defaultValue={profile.data?.country_code ?? ""} className={controlClass}>
                <option value="">Not stated</option>
                {countries.map(([code, name]) => (
                  <option key={code} value={code}>{name}</option>
                ))}
              </select>
            )}
          </Field>
          <SubmitButton pendingLabel="Saving">Save profile</SubmitButton>
        </form>
      )}
      <p className="mt-6">
        <Link href="/account" className="font-semibold text-forest-800">Back to account</Link>
      </p>
    </Container>
  );
}
