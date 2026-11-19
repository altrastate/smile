import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { catalogueHref, parseCatalogueParams, sanitizeSearch } from "./params";
import { cataloguePageState, categoryNamePattern, postgrestSearchOr, productSearch } from "./search";

describe("catalogue parameters", () => {
  it("keeps a normal search and drops characters that are not part of a catalogue query", () => {
    assert.equal(sanitizeSearch("  Moringa, (tea)  "), "Moringa tea");
    assert.equal(parseCatalogueParams({ q: "hibiscus-leaf" }).q, "hibiscus-leaf");
  });

  it("bounds long search text", () => {
    assert.equal(sanitizeSearch("a".repeat(200)).length, 80);
  });

  it("accepts a category slug and ignores a slug that is not a slug", () => {
    assert.equal(parseCatalogueParams({ category: "natural-foods" }).category, "natural-foods");
    assert.equal(parseCatalogueParams({ category: "../natural-foods" }).category, "");
    assert.equal(parseCatalogueParams({ category: "Natural Foods" }).category, "");
  });

  it("uses newest unless sort is name", () => {
    assert.equal(parseCatalogueParams({}).sort, "newest");
    assert.equal(parseCatalogueParams({ sort: "name" }).sort, "name");
    assert.equal(parseCatalogueParams({ sort: "price" }).sort, "newest");
    assert.equal(parseCatalogueParams({ sort: ["name", "newest"] }).sort, "name");
  });

  it("rejects page numbers that are not a positive integer in range", () => {
    assert.equal(parseCatalogueParams({ page: "0" }).page, 1);
    assert.equal(parseCatalogueParams({ page: "-4" }).page, 1);
    assert.equal(parseCatalogueParams({ page: "2.5" }).page, 1);
    assert.equal(parseCatalogueParams({ page: "nope" }).page, 1);
    assert.equal(parseCatalogueParams({ page: "501" }).page, 1);
    assert.equal(parseCatalogueParams({ page: "12" }).page, 12);
    assert.equal(parseCatalogueParams({ page: ["3", "9"] }).page, 3);
  });

  it("uses the first repeated query value", () => {
    const params = parseCatalogueParams({
      q: ["moringa", "hibiscus"],
      category: ["herbal-products", "natural-foods"],
    });
    assert.equal(params.q, "moringa");
    assert.equal(params.category, "herbal-products");
  });
});

describe("catalogue URLs", () => {
  it("builds search, category, sort, and page together", () => {
    assert.equal(catalogueHref("/shop", { q: "", category: "", sort: "newest" }), "/shop");
    assert.equal(catalogueHref("/shop", { q: "moringa", category: "", sort: "newest" }), "/shop?q=moringa");
    assert.equal(
      catalogueHref("/shop", { q: "", category: "herbal-products", sort: "name", page: 2 }),
      "/shop?category=herbal-products&sort=name&page=2",
    );
    assert.equal(
      catalogueHref("/categories/natural-foods", { q: "tea", category: "natural-foods", sort: "newest", page: 3 }),
      "/categories/natural-foods?q=tea&category=natural-foods&page=3",
    );
  });

  it("omits the page parameter on the first page", () => {
    assert.equal(catalogueHref("/shop", { q: "tea", category: "", sort: "newest", page: 1 }), "/shop?q=tea");
  });
});

describe("catalogue search filters", () => {
  it("searches product text when no category id matches", () => {
    assert.deepEqual(productSearch("moringa", []), { kind: "text", term: "moringa" });
  });

  it("includes only UUID category ids in the combined filter", () => {
    const id = "11111111-1111-4111-8111-111111111111";
    const search = productSearch("herbal", [id, "not-a-uuid"]);
    assert.deepEqual(search, { kind: "text-or-categories", term: "herbal", categoryIds: [id] });
    assert.equal(
      postgrestSearchOr("herbal", [id]),
      `search_vector.wfts(simple)."herbal",category_id.in.(${id})`,
    );
  });

  it("does not let filter punctuation become extra PostgREST clauses", () => {
    assert.deepEqual(productSearch('tea,id.eq.1)', []), { kind: "text", term: "tea id eq 1" });
    assert.throws(() => postgrestSearchOr("tea,id.eq.1", ["11111111-1111-4111-8111-111111111111"]));
    assert.throws(() => postgrestSearchOr("tea", ["not-a-uuid"]));
  });

  it("treats an empty search as no search", () => {
    assert.deepEqual(productSearch(" ,,, ", []), { kind: "none" });
    assert.equal(categoryNamePattern("tea"), "%tea%");
  });
});

describe("pagination state", () => {
  it("detects the first page, a later page, and a page past the end", () => {
    assert.deepEqual(cataloguePageState(0, 1, 12), { pageCount: 0, outOfRange: false });
    assert.deepEqual(cataloguePageState(12, 1, 12), { pageCount: 1, outOfRange: false });
    assert.deepEqual(cataloguePageState(30, 2, 12), { pageCount: 3, outOfRange: false });
    assert.deepEqual(cataloguePageState(30, 3, 12), { pageCount: 3, outOfRange: false });
    assert.deepEqual(cataloguePageState(30, 4, 12), { pageCount: 3, outOfRange: true });
  });
});
