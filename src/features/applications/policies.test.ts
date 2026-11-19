import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const catalogue = readFileSync("supabase/migrations/20261119095711_catalogue_foundation.sql", "utf8");
const identity = readFileSync("supabase/migrations/20261119113107_identity_and_applications.sql", "utf8");
const guards = readFileSync("supabase/migrations/20261119124504_application_history_guards.sql", "utf8");
const transactions = readFileSync("supabase/migrations/20261119124532_application_transactions.sql", "utf8");

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
    assert.doesNotMatch(guards, /update public\.products/i);
    assert.doesNotMatch(transactions, /update public\.products/i);
    assert.match(identity, /set approval_status = 'approved'/);
    assert.match(identity, /new\.status = 'approved'/);
  });

  it("keeps applicant and reviewer transitions in the database trigger", () => {
    assert.match(guards, /old\.status = 'draft' and new\.status = 'submitted'/);
    assert.match(guards, /old\.status = 'information_requested' and new\.status = 'submitted'/);
    assert.match(guards, /new\.status = 'withdrawn'/);
    assert.match(guards, /old\.status = 'submitted' and new\.status in \('under_review', 'information_requested', 'approved', 'rejected'\)/);
    assert.match(guards, /old\.status = 'under_review' and new\.status in \('information_requested', 'approved', 'rejected'\)/);
    assert.match(guards, /you cannot decide your own application|reviewer := false/);
  });

  it("creates, saves, and decides an application in one function without swallowing errors", () => {
    const start = transactions.slice(
      transactions.indexOf("function private.start_business_application"),
      transactions.indexOf("function private.save_business_application"),
    );
    const save = transactions.slice(
      transactions.indexOf("function private.save_business_application"),
      transactions.indexOf("function private.withdraw_business_application"),
    );
    const decision = transactions.slice(
      transactions.indexOf("function private.decide_business_application"),
      transactions.indexOf("revoke all on function private.start_business_application"),
    );
    assert.match(start, /insert into public\.businesses/);
    assert.match(start, /insert into public\.business_applications/);
    assert.match(start, /insert into public\.business_members/);
    assert.match(start, /insert into public\.business_application_events/);
    assert.match(save, /update public\.businesses/);
    assert.match(save, /update public\.business_applications/);
    assert.match(save, /delete from public\.business_application_categories/);
    assert.match(save, /insert into public\.business_application_categories/);
    assert.match(decision, /insert into public\.business_application_internal_notes/);
    assert.match(decision, /update public\.business_applications/);
    for (const body of [start, save, decision]) {
      assert.doesNotMatch(body, /exception when/i);
    }
  });
});
