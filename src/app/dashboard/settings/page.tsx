import type { Metadata } from "next";
import Link from "next/link";
import { SubmitButton } from "@/components/auth/submit-button";
import { selectBusiness } from "@/features/dashboard/actions";
import { loadWorkspace } from "@/features/dashboard/queries";
import { approvalLabel, kindLabel } from "@/features/dashboard/workspace-gate";

export const metadata: Metadata = { title: "Workspace settings" };

export default async function SettingsPage() {
  const workspace = await loadWorkspace();
  if (workspace.status !== "ready") {
    return null;
  }
  const business = workspace.business;

  return (
    <section>
      <h1 className="font-serif text-4xl text-forest-900">Settings</h1>
      <dl className="mt-6 grid max-w-2xl gap-4">
        {[
          ["Business", business.name],
          ["Kind", kindLabel(business.kind)],
          ["Approval", approvalLabel(business.approval)],
          ["Your role", business.role === "owner" ? "Owner" : "Representative"],
          ["Public address", `/businesses/${business.slug}`],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="text-sm font-semibold text-charcoal-700">{label}</dt>
            <dd className="text-lg text-charcoal-900">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-6 max-w-2xl text-charcoal-700">
        Approval, membership, and reviewer notes are not edited here. The public address stays the same when the
        display name changes.
      </p>
      <p className="mt-4">
        <Link href={`/businesses/${business.slug}`} className="font-semibold text-forest-800">
          Open the public storefront
        </Link>
      </p>
      <p className="mt-3">
        <Link href="/account" className="font-semibold text-forest-800">
          Account
        </Link>
      </p>
      {workspace.businesses.length > 1 ? (
        <form action={selectBusiness} className="mt-8 grid max-w-xl gap-3">
          <label htmlFor="settings-business" className="text-sm font-semibold text-charcoal-900">
            Switch business
          </label>
          <select id="settings-business" name="businessId" className="min-h-11 border border-beige-300 bg-ivory-50 px-3" defaultValue={business.id}>
            {workspace.businesses.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <SubmitButton pendingLabel="Switching">Switch</SubmitButton>
        </form>
      ) : null}
    </section>
  );
}
