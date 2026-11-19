export const businessKinds = [
  "producer",
  "manufacturer",
  "supplier",
  "distributor",
  "retailer",
  "service_provider",
] as const;

export const approvalStatuses = ["pending", "approved", "rejected", "suspended"] as const;

export type BusinessKind = (typeof businessKinds)[number];
export type ApprovalStatus = (typeof approvalStatuses)[number];

export type MembershipRecord = {
  approval: ApprovalStatus;
  kind: BusinessKind;
};

export type WorkspaceState = "eligible" | "pending" | "rejected" | "suspended" | "other-kind" | "none";

export function workspaceState(record: MembershipRecord | null): WorkspaceState {
  if (!record) {
    return "none";
  }
  if (record.kind !== "producer") {
    return "other-kind";
  }
  if (record.approval === "approved") {
    return "eligible";
  }
  if (record.approval === "pending") {
    return "pending";
  }
  if (record.approval === "rejected") {
    return "rejected";
  }
  return "suspended";
}

export function storefrontCompletion(fields: {
  description: string;
  countryCode: string | null;
  city: string | null;
  website: string | null;
}) {
  const filled = [fields.description.trim(), fields.countryCode, fields.city, fields.website].filter(
    (value) => Boolean(value && value.trim()),
  ).length;
  return { filled, total: 4 };
}

export type PublicationStatus = "draft" | "published" | "archived";

export type ListingLabel = "draft" | "unpublished" | "published" | "archived";

export function listingLabel(status: PublicationStatus, publishedAt: string | null): ListingLabel {
  if (status === "published") {
    return "published";
  }
  if (status === "archived") {
    return "archived";
  }
  return publishedAt ? "unpublished" : "draft";
}

export function canSetPublication(from: PublicationStatus, to: PublicationStatus) {
  if (from === "draft") {
    return to === "published" || to === "archived";
  }
  if (from === "published") {
    return to === "draft" || to === "archived";
  }
  return to === "draft";
}

export function publicationAction(from: PublicationStatus, to: PublicationStatus) {
  if (!canSetPublication(from, to)) {
    return null;
  }
  if (to === "published") {
    return "Publish";
  }
  if (to === "archived") {
    return "Archive";
  }
  return listingLabel(from, "published") === "published" ? "Unpublish" : "Restore to draft";
}
