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
      description="The address is not part of the current site. Home, about, contact, and the not-yet-open marketplace pages are the pages that exist."
    />
  );
}
