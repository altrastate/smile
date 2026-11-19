import type { Metadata } from "next";
import { Container } from "@/components/layout/container";

export const metadata: Metadata = { title: "Account terms" };

export default function TermsPage() {
  return (
    <Container as="section" className="py-12 md:py-16">
      <h1 className="font-serif text-4xl text-forest-900">Account terms</h1>
      <div className="mt-6 max-w-2xl space-y-4 text-lg leading-relaxed text-charcoal-700">
        <p>
          Creating an account means you will give accurate information about yourself and, if you apply, about the
          business. You confirm that you are allowed to submit that information.
        </p>
        <p>
          Smile stores your name, email, optional phone number, country, and the contents of any business application,
          including documents you upload. Those documents are private. They are not part of the public catalogue.
        </p>
        <p>
          An account does not approve a business, and an approved business does not publish products. Email delivery
          depends on the Supabase project. This page is the account notice for this phase. It is not a complete legal
          policy.
        </p>
      </div>
    </Container>
  );
}
