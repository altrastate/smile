import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = {
  title: "Businesses",
  description: "The business directory is not open yet.",
};

export default function BusinessesPage() {
  return (
    <ComingSoon
      title="The business directory is not open"
      description="Business profiles will appear after accounts and applications exist. This page does not list companies."
    />
  );
}
