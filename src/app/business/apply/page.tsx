import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { SubmitButton } from "@/components/auth/submit-button";
import { startApplication } from "@/features/applications/actions";
import { requireUser } from "@/features/auth/session";

export const metadata: Metadata = { title: "Apply for a business" };

export default async function ApplyPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  await requireUser("/business/apply");

  return (
    <Container as="section" className="py-12 md:py-16">
      <h1 className="font-serif text-4xl text-forest-900">Apply for a business</h1>
      <p className="mt-4 max-w-2xl text-lg text-charcoal-700">
        Start a draft, save it, and submit it when the details are complete. Submitting does not approve the business
        or publish any products.
      </p>
      {params.error ? (
        <p className="mt-6 max-w-2xl text-base text-charcoal-700">
          A draft could not be created. Accounts and applications are available after the identity migration is applied.
        </p>
      ) : null}
      <form action={startApplication} className="mt-8">
        <SubmitButton pendingLabel="Starting">Start a draft</SubmitButton>
      </form>
      <p className="mt-6">
        <Link href="/account/applications" className="font-semibold text-forest-800">View your applications</Link>
      </p>
    </Container>
  );
}
