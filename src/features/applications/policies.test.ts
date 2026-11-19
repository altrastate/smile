import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const catalogue = readFileSync("supabase/migrations/20261119095711_catalogue_foundation.sql", "utf8");
const identity = readFileSync("supabase/migrations/20261119113107_identity_and_applications.sql", "utf8");

describe("catalogue visibility is preserved in the migrations", () => {
  it("still requires a published product, an approved business, and an active category", () => {
    assert.match(catalogue, /Public reads published products of approved businesses/);
    assert.match(catalogue, /publication_status = 'published'/);
    assert.match(catalogue, /businesses.approval_status = 'approved'/);
    assert.match(catalogue, /categories.is_active = true/);
  });

  it("does not drop catalogue policies or publish products when a business is approved", () => {
    assert.doesNotMatch(identity, /drop policy/i);
    assert.doesNotMatch(identity, /update public\.products/i);
    assert.match(identity, /set approval_status = 'approved'/);
  });
});
