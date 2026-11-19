import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { SubmitButton } from "@/components/auth/submit-button";
import { Input } from "@/components/ui/input";
import { forgotPasswordAction } from "@/features/auth/actions";

export const metadata: Metadata = { title: "Forgot password" };

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; status?: string }>;
}) {
  const params = await searchParams;

  return (
    <Container as="section" className="py-12 md:py-16">
      <h1 className="font-serif text-4xl text-forest-900">Reset your password</h1>
      <p className="mt-4 max-w-2xl text-lg text-charcoal-700">
        If this project is set up to send email, Supabase will send a recovery link. Smile does not run its own mail server.
      </p>
      {params.status === "sent" ? (
        <p className="mt-6 max-w-xl text-base text-charcoal-700">
          If an account exists for that email, a recovery message has been requested. The link expires after the period set in Supabase.
        </p>
      ) : null}
      {params.error ? (
        <p className="mt-6 max-w-xl text-base text-danger-700">
          {params.error === "invalid" ? "Enter a valid email address." : params.error}
        </p>
      ) : null}
      <form action={forgotPasswordAction} className="mt-8 grid max-w-xl gap-4">
        <Input label="Email" name="email" type="email" autoComplete="email" required />
        <SubmitButton pendingLabel="Sending">Send recovery link</SubmitButton>
      </form>
      <p className="mt-6">
        <Link href="/login" className="font-semibold text-forest-800">Back to log in</Link>
      </p>
    </Container>
  );
}
