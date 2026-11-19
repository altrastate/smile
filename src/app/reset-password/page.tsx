import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { SubmitButton } from "@/components/auth/submit-button";
import { Input } from "@/components/ui/input";
import { resetPasswordAction } from "@/features/auth/actions";
import { getSessionUser } from "@/features/auth/session";

export const metadata: Metadata = { title: "Choose a new password" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const { user } = await getSessionUser();

  return (
    <Container as="section" className="py-12 md:py-16">
      <h1 className="font-serif text-4xl text-forest-900">Choose a new password</h1>
      {params.error === "expired" || !user ? (
        <p className="mt-6 max-w-xl text-base text-charcoal-700">
          This recovery link is missing or has expired. <Link href="/forgot-password" className="font-semibold text-forest-800">Request a new one</Link>.
        </p>
      ) : (
        <form action={resetPasswordAction} className="mt-8 grid max-w-xl gap-4">
          {params.error ? (
            <p className="text-base text-danger-700">
              {params.error === "invalid" ? "Use at least 10 characters with a letter and a number, and repeat the password." : params.error}
            </p>
          ) : null}
          <Input label="New password" name="password" type="password" autoComplete="new-password" required />
          <Input label="Confirm password" name="confirmPassword" type="password" autoComplete="new-password" required />
          <SubmitButton pendingLabel="Saving">Save password</SubmitButton>
        </form>
      )}
    </Container>
  );
}
