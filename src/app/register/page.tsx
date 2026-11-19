import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { SubmitButton } from "@/components/auth/submit-button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { registerAction } from "@/features/auth/actions";

export const metadata: Metadata = { title: "Create an account" };

const errors: Record<string, string> = {
  invalid: "Check your name, email, and password. Use at least 10 characters with a letter and a number, and accept the account terms.",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const message = params.error ? (errors[params.error] ?? params.error) : null;

  return (
    <Container as="section" className="py-12 md:py-16">
      <h1 className="font-serif text-4xl text-forest-900">Create an account</h1>
      <p className="mt-4 max-w-2xl text-lg text-charcoal-700">
        This account is for you. A business is added later, through an application that Smile reviews.
      </p>
      {message ? <p className="mt-6 max-w-xl text-base text-danger-700">{message}</p> : null}
      <form action={registerAction} className="mt-8 grid max-w-xl gap-4">
        <Input label="Full name" name="fullName" autoComplete="name" required />
        <Input label="Email" name="email" type="email" autoComplete="email" required />
        <Input label="Password" name="password" type="password" autoComplete="new-password" required hint="At least 10 characters, with a letter and a number." />
        <Input label="Confirm password" name="confirmPassword" type="password" autoComplete="new-password" required />
        <Checkbox
          name="terms"
          required
          label="I accept the account terms. I will give accurate information, and I understand Smile stores my name, email, and any application I submit."
        />
        <p className="text-sm text-charcoal-700">
          Read the <Link href="/terms" className="font-semibold text-forest-800">account terms</Link> before continuing.
        </p>
        <SubmitButton pendingLabel="Creating account">Create account</SubmitButton>
      </form>
      <p className="mt-6 text-base text-charcoal-700">
        Already have an account? <Link href="/login" className="font-semibold text-forest-800">Log in</Link>
      </p>
    </Container>
  );
}
