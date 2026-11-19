import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  canSetPublication,
  listingLabel,
  storefrontCompletion,
  resolveWorkspaceSelection,
  workspaceState,
} from "@/features/dashboard/eligibility";
import { detectProductImage, isSafeProductImagePath, maxProductImageBytes, productImagePath } from "@/features/dashboard/images";
import { escapeIlike, productSchema, productSlug, storefrontSchema } from "@/features/dashboard/validation";

const producer = readFileSync("supabase/migrations/20261119131559_producer_storefront.sql", "utf8");

describe("producer eligibility", () => {
  it("allows only an approved producer membership", () => {
    assert.equal(workspaceState({ approval: "approved", kind: "producer" }), "eligible");
    assert.equal(workspaceState({ approval: "pending", kind: "producer" }), "pending");
    assert.equal(workspaceState({ approval: "rejected", kind: "producer" }), "rejected");
    assert.equal(workspaceState({ approval: "suspended", kind: "producer" }), "suspended");
    assert.equal(workspaceState({ approval: "approved", kind: "manufacturer" }), "other-kind");
    assert.equal(workspaceState({ approval: "pending", kind: "supplier" }), "other-kind");
    assert.equal(workspaceState(null), "none");
  });

  it("explains the only closed business instead of asking for a choice", () => {
    const suspended = { id: "suspended", state: "suspended" as const };
    const approved = { id: "approved", state: "eligible" as const };
    assert.equal(resolveWorkspaceSelection([suspended], undefined).status, "blocked");
    assert.equal(resolveWorkspaceSelection([approved], undefined).status, "ready");
    assert.equal(resolveWorkspaceSelection([suspended, approved], undefined).status, "ready");
    assert.equal(resolveWorkspaceSelection([suspended, approved], "suspended").status, "blocked");
    assert.equal(resolveWorkspaceSelection([], undefined).status, "empty");
  });

  it("counts the four public storefront fields", () => {
    assert.deepEqual(
      storefrontCompletion({ description: " Grown in Mukono. ", countryCode: "UG", city: null, website: "" }),
      { filled: 2, total: 4 },
    );
  });
});

describe("product publication", () => {
  it("maps an unpublished listing without adding a status", () => {
    assert.equal(listingLabel("draft", null), "draft");
    assert.equal(listingLabel("draft", "2026-11-19T00:00:00Z"), "unpublished");
    assert.equal(listingLabel("published", "2026-11-19T00:00:00Z"), "published");
    assert.equal(listingLabel("archived", null), "archived");
  });

  it("allows publish, unpublish, archive, and restore to draft", () => {
    assert.equal(canSetPublication("draft", "published"), true);
    assert.equal(canSetPublication("published", "draft"), true);
    assert.equal(canSetPublication("published", "archived"), true);
    assert.equal(canSetPublication("draft", "archived"), true);
    assert.equal(canSetPublication("archived", "draft"), true);
    assert.equal(canSetPublication("archived", "published"), false);
    assert.equal(canSetPublication("published", "published"), false);
  });
});

describe("storefront and product validation", () => {
  it("rejects an external website that is not https and a short name", () => {
    const result = storefrontSchema.safeParse({
      displayName: "A",
      description: "",
      countryCode: "UG",
      city: "",
      district: "",
      website: "http://example.com",
      contactEmail: "",
      contactPhone: "",
    });
    assert.equal(result.success, false);
  });

  it("builds a slug from the product name", () => {
    assert.equal(productSlug("Raw Shea Butter", "abc123"), "raw-shea-butter-abc123");
    const parsed = productSchema.safeParse({
      name: "Raw shea",
      slug: "raw-shea",
      categoryId: "00000000-0000-4000-8000-000000000001",
      shortDescription: "",
      description: "",
      brandName: "",
      manufacturerName: "",
      productType: "",
      originCountryCode: "",
      ingredients: "",
    });
    assert.equal(parsed.success, true);
  });

  it("escapes search wildcards", () => {
    assert.equal(escapeIlike("100%_shea\\"), "100\\%\\_shea\\\\");
  });
});

describe("product images", () => {
  it("accepts JPEG, PNG, and WebP signatures and rejects HTML and oversized files", () => {
    assert.equal(detectProductImage(Uint8Array.from([0xff, 0xd8, 0xff, 0x00])), "image/jpeg");
    assert.equal(detectProductImage(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), "image/png");
    const webp = new Uint8Array(12);
    webp.set([0x52, 0x49, 0x46, 0x46], 0);
    webp.set([0x57, 0x45, 0x42, 0x50], 8);
    assert.equal(detectProductImage(webp), "image/webp");
    assert.equal(detectProductImage(Uint8Array.from([0x3c, 0x68, 0x74, 0x6d, 0x6c])), null);
    assert.equal(detectProductImage(new Uint8Array(maxProductImageBytes + 1)), null);
    assert.equal(detectProductImage(new Uint8Array()), null);
  });

  it("keeps the object inside the business and product folders", () => {
    const business = "11111111-1111-4111-8111-111111111111";
    const product = "22222222-2222-4222-8222-222222222222";
    const object = "33333333-3333-4333-8333-333333333333";
    const path = productImagePath(business, product, object, "image/jpeg");
    assert.equal(isSafeProductImagePath(path), true);
    assert.equal(isSafeProductImagePath(`../${path}`), false);
    assert.equal(isSafeProductImagePath(`${business}/${product}/file.html`), false);
  });
});

describe("producer migration preserves catalogue publication", () => {
  it("does not publish products from business approval and does not drop catalogue policies", () => {
    assert.doesNotMatch(producer, /drop policy/i);
    assert.doesNotMatch(producer, /update public\.products[\s\S]*publication_status = 'published'/i);
    const created = producer.slice(
      producer.indexOf("function private.create_producer_product"),
      producer.indexOf("function private.update_producer_product"),
    );
    assert.match(created, /publication_status/);
    assert.match(created, /'draft'/);
    assert.doesNotMatch(created, /'published'/);
    assert.match(producer, /business is not approved/);
    assert.match(producer, /this workspace is only for producers/);
    assert.match(producer, /status change is not allowed/);
    const copy = producer.slice(
      producer.indexOf("function private.copy_approved_storefront"),
      producer.indexOf("function private.assert_producer"),
    );
    assert.doesNotMatch(copy, /public\.products/);
    assert.doesNotMatch(copy, /approval_status/);
  });
});
