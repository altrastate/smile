import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/container";

export const metadata: Metadata = { title: "Application submitted" };

export default async function SubmittedPage({
  searchParams,
}: {
  searchParams: Promise<{ application?: string }>;
}) {
  const params = await searchParams;
  const href = params.application ? `/business/apply/${params.application}` : "/account/applications";

  return (
    <Container as="section" className="py-12 md:py-16">
      <h1 className="font-serif text-4xl text-forest-900">Application submitted</h1>
      <p className="mt-4 max-w-2xl text-lg text-charcoal-700">
        Smile has recorded your application as submitted. It is not approved. Nothing has been published to the
        catalogue. A reviewer will see it in the review queue. Status changes appear on the application itself.
      </p>
      <p className="mt-6">
        <Link href={href} className="font-semibold text-forest-800">View the application</Link>
      </p>
    </Container>
  );
}
