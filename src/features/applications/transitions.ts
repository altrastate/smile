export const applicantTransitions = {
  draft: ["submitted", "withdrawn"],
  information_requested: ["submitted", "withdrawn"],
  submitted: ["withdrawn"],
} as const;

export const reviewerTransitions = {
  submitted: ["under_review", "information_requested", "approved", "rejected"],
  under_review: ["information_requested", "approved", "rejected"],
} as const;

type ApplicantStatus = keyof typeof applicantTransitions;
type ReviewerStatus = keyof typeof reviewerTransitions;

export function canApplicantTransition(from: string, to: string) {
  const allowed = applicantTransitions[from as ApplicantStatus] as readonly string[] | undefined;
  return Boolean(allowed?.includes(to));
}

export function canReviewerTransition(from: string, to: string) {
  const allowed = reviewerTransitions[from as ReviewerStatus] as readonly string[] | undefined;
  return Boolean(allowed?.includes(to));
}

export function businessSlug(name: string) {
  const base = name
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base || "business"}-${suffix}`;
}
