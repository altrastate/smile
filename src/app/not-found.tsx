import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = {
  title: "Page not available",
};

export default function NotFound() {
  return (
    <ComingSoon
      eyebrow="Not found"
      title="This page is not available"
      description="That address does not match a page on this site."
    />
  );
}
