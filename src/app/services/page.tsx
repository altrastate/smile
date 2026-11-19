import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = {
  title: "Services",
  description: "Service listings are not open yet.",
};

export default function ServicesPage() {
  return (
    <ComingSoon
      title="Services are not listed yet"
      description="Service providers will have their own listings in a later phase. Nothing on this page can be booked."
    />
  );
}
