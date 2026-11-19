import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { authFailureMessage, registerSchema, resetPasswordSchema, safeNextPath } from "./validation";

describe("registration validation", () => {
  it("accepts a complete registration", () => {
    const parsed = registerSchema.safeParse({
      fullName: "Amina Kato",
      email: "amina@example.com",
      password: "nature12345",
      confirmPassword: "nature12345",
      terms: "on",
    });
    assert.equal(parsed.success, true);
  });

  it("rejects a weak password, a mismatched confirmation, and missing terms", () => {
    const parsed = registerSchema.safeParse({
      fullName: "A",
      email: "not-an-email",
      password: "short",
      confirmPassword: "other",
      terms: "",
    });
    assert.equal(parsed.success, false);
  });
});

describe("password recovery validation", () => {
  it("requires the new passwords to match", () => {
    const parsed = resetPasswordSchema.safeParse({ password: "nature12345", confirmPassword: "nature12346" });
    assert.equal(parsed.success, false);
  });
});

describe("auth redirects and errors", () => {
  it("keeps internal paths and drops external redirects", () => {
    assert.equal(safeNextPath("/account/profile"), "/account/profile");
    assert.equal(safeNextPath("https://example.com"), "/account");
    assert.equal(safeNextPath("//example.com"), "/account");
    assert.equal(safeNextPath("/%2F%2Fexample.com"), "/account");
    assert.equal(safeNextPath("/\\example.com"), "/account");
  });

  it("does not repeat internal auth errors", () => {
    assert.match(authFailureMessage("User already registered"), /already exists/);
    assert.equal(authFailureMessage("database connection reset by peer"), "That request could not be completed.");
  });
});
