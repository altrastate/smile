import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { businessSlug, canApplicantTransition, canReviewerTransition } from "./transitions";

describe("application status transitions", () => {
  it("lets an applicant submit, resubmit, and withdraw, and not approve", () => {
    assert.equal(canApplicantTransition("draft", "submitted"), true);
    assert.equal(canApplicantTransition("information_requested", "submitted"), true);
    assert.equal(canApplicantTransition("submitted", "withdrawn"), true);
    assert.equal(canApplicantTransition("submitted", "approved"), false);
    assert.equal(canApplicantTransition("approved", "draft"), false);
  });

  it("lets a reviewer decide a submitted or in-review application", () => {
    assert.equal(canReviewerTransition("submitted", "under_review"), true);
    assert.equal(canReviewerTransition("under_review", "information_requested"), true);
    assert.equal(canReviewerTransition("under_review", "approved"), true);
    assert.equal(canReviewerTransition("under_review", "rejected"), true);
    assert.equal(canReviewerTransition("draft", "approved"), false);
    assert.equal(canReviewerTransition("approved", "rejected"), false);
  });

  it("builds a slug without spaces", () => {
    assert.match(businessSlug("Kato Growers"), /^kato-growers-[a-z0-9]+$/);
  });
});
