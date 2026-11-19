import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/container";

export const metadata: Metadata = { title: "Confirm your email" };

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const expired = params.status === "expired";

  return (
    <Container as="section" className="py-12 md:py-16">
      <h1 className="font-serif text-4xl text-forest-900">{expired ? "This link has expired" : "Confirm your email"}</h1>
      <p className="mt-4 max-w-2xl text-lg text-charcoal-700">
        {expired
          ? "The confirmation or recovery link is no longer valid. Request a new password reset, or create the account again if you have not confirmed it."
          : "If email confirmation is enabled for this Supabase project, open the message Supabase sends and use the link. Smile does not send that message itself. If confirmation is turned off, you can log in immediately."}
      </p>
      <p className="mt-6">
        <Link href="/login" className="font-semibold text-forest-800">Go to log in</Link>
      </p>
    </Container>
  );
}
