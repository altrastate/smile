import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = {
  title: "Shop",
  description: "The Smile catalogue is not open yet.",
};

export default function ShopPage() {
  return (
    <ComingSoon
      title="The shop is not open"
      description="The catalogue will list published products from businesses on Smile. There is nothing to buy, and no cart, on this page."
    />
  );
}
