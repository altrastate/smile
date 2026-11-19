import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { SubmitButton } from "@/components/auth/submit-button";
import { Input } from "@/components/ui/input";
import { loginAction } from "@/features/auth/actions";
import { safeNextPath } from "@/features/auth/validation";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;
  const nextPath = safeNextPath(params.next);

  return (
    <Container as="section" className="py-12 md:py-16">
      <h1 className="font-serif text-4xl text-forest-900">Log in</h1>
      {params.error ? (
        <p className="mt-6 max-w-xl text-base text-danger-700">
          {params.error === "invalid" ? "Enter your email and password." : params.error}
        </p>
      ) : null}
      <form action={loginAction} className="mt-8 grid max-w-xl gap-4">
        <input type="hidden" name="next" value={nextPath} />
        <Input label="Email" name="email" type="email" autoComplete="email" required />
        <Input label="Password" name="password" type="password" autoComplete="current-password" required />
        <SubmitButton pendingLabel="Signing in">Log in</SubmitButton>
      </form>
      <p className="mt-6 text-base text-charcoal-700">
        <Link href="/forgot-password" className="font-semibold text-forest-800">Forgot your password?</Link>
      </p>
      <p className="mt-2 text-base text-charcoal-700">
        New to Smile? <Link href="/register" className="font-semibold text-forest-800">Create an account</Link>
      </p>
    </Container>
  );
}
