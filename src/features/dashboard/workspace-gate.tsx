import Link from "next/link";
import { SubmitButton } from "@/components/auth/submit-button";
import { Alert } from "@/components/ui/alert";
import { selectBusiness } from "@/features/dashboard/actions";
import type { ProducerBusiness, WorkspaceLoad } from "@/features/dashboard/queries";

const kindLabels: Record<ProducerBusiness["kind"], string> = {
  producer: "Producer",
  manufacturer: "Manufacturer",
  supplier: "Supplier",
  distributor: "Distributor",
  retailer: "Retailer",
  service_provider: "Service provider",
};

const approvalLabels: Record<ProducerBusiness["approval"], string> = {
  pending: "Pending review",
  approved: "Approved",
  rejected: "Rejected",
  suspended: "Suspended",
};

export function approvalLabel(status: ProducerBusiness["approval"]) {
  return approvalLabels[status];
}

export function kindLabel(kind: ProducerBusiness["kind"]) {
  return kindLabels[kind];
}

export function WorkspaceNotice({ code }: { code?: string }) {
  if (code === "saved" || code === "created" || code === "updated" || code === "image") {
    return <Alert tone="success" title="Saved." />;
  }
  if (code === "unavailable") {
    return <Alert tone="warning" title="This action is not available until the producer migration is applied." />;
  }
  if (code === "forbidden") {
    return <Alert tone="danger" title="You cannot change that business or listing." />;
  }
  if (code === "invalid") {
    return <Alert tone="danger" title="Check the form and try again." />;
  }
  if (code === "confirm") {
    return <Alert tone="warning" title="Confirm the action before it can be saved." />;
  }
  if (code === "orphan") {
    return (
      <Alert tone="danger" title="The listing was not left fully consistent.">
        The image record and the stored file did not both succeed. The failed file was recorded for recovery.
      </Alert>
    );
  }
  if (code === "save") {
    return <Alert tone="danger" title="The change was not saved." />;
  }
  return null;
}

function Switcher({ businesses }: { businesses: ProducerBusiness[] }) {
  if (businesses.length < 2) {
    return null;
  }
  return (
    <form action={selectBusiness} className="mt-6 flex max-w-xl flex-col gap-3">
      <label htmlFor="businessId" className="text-sm font-semibold text-charcoal-900">
        Choose a business
      </label>
      <select id="businessId" name="businessId" className="min-h-11 border border-beige-300 bg-ivory-50 px-3" required>
        {businesses.map((business) => (
          <option key={business.id} value={business.id}>
            {business.name} · {kindLabel(business.kind)} · {approvalLabel(business.approval)}
          </option>
        ))}
      </select>
      <SubmitButton pendingLabel="Opening">Open workspace</SubmitButton>
    </form>
  );
}

export function WorkspaceGate({ workspace }: { workspace: Exclude<WorkspaceLoad, { status: "ready" }> }) {
  if (workspace.status === "unavailable") {
    return <p className="mt-6 max-w-2xl text-lg text-charcoal-700">{workspace.message}</p>;
  }
  if (workspace.status === "empty") {
    return (
      <div className="mt-6 max-w-2xl text-lg text-charcoal-700">
        <p>You do not belong to a business yet.</p>
        <p className="mt-4">
          <Link href="/business/apply" className="font-semibold text-forest-800">
            Apply for a business
          </Link>
        </p>
      </div>
    );
  }
  if (workspace.status === "choose") {
    return (
      <div className="mt-6">
        <p className="max-w-2xl text-lg text-charcoal-700">Choose the business you want to open.</p>
        <Switcher businesses={workspace.businesses} />
      </div>
    );
  }
  const business = workspace.business;
  const message =
    business.state === "pending"
      ? "This business is still waiting for review. The producer workspace opens after approval."
      : business.state === "rejected"
        ? "This business application was not approved, so the producer workspace is closed."
        : business.state === "suspended"
          ? "This business is suspended. Listings cannot be managed until the suspension is lifted."
          : `This workspace is for approved producers. This business is registered as a ${kindLabel(business.kind).toLowerCase()}.`;
  return (
    <div className="mt-6 max-w-2xl">
      <p className="text-lg text-charcoal-700">{message}</p>
      <p className="mt-4">
        <Link href="/account/applications" className="font-semibold text-forest-800">
          View your applications
        </Link>
      </p>
      <Switcher businesses={workspace.businesses} />
    </div>
  );
}
