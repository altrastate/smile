import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = {
  title: "Page not available",
};

export default function NotFound() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-16">
      <EmptyState
        title="This page is not part of the current release"
        description="The address is not implemented. The foundation page is the only screen in Phase 01."
        action={
          <Link href="/" className="inline-flex min-h-11 items-center border border-forest-800 px-4 font-semibold text-forest-800">
            Back to the foundation
          </Link>
        }
      />
    </section>
  );
}
