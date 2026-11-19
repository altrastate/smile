import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = {
  title: "Categories",
  description: "Category browsing is not open yet.",
};

export default function CategoriesPage() {
  return (
    <ComingSoon
      title="Categories are not open"
      description="Category pages will follow the catalogue. The themes on the homepage are not live departments."
    />
  );
}
