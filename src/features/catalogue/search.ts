import { sanitizeSearch } from "./params";

const safeTerm = /^[\p{L}\p{N}]+(?:[ -][\p{L}\p{N}]+)*$/u;
const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type ProductSearch =
  | { kind: "none" }
  | { kind: "text"; term: string }
  | { kind: "text-or-categories"; term: string; categoryIds: string[] };

export function categoryNamePattern(term: string) {
  return `%${term.replace(/[\\%_]/g, "")}%`;
}

export function productSearch(term: string | undefined, categoryIds: readonly string[]): ProductSearch {
  const clean = sanitizeSearch(term);
  if (!clean || !safeTerm.test(clean)) {
    return { kind: "none" };
  }
  const ids = categoryIds.filter((id) => uuid.test(id));
  if (ids.length === 0) {
    return { kind: "text", term: clean };
  }
  return { kind: "text-or-categories", term: clean, categoryIds: ids };
}

/**
 * Builds a PostgREST `or` filter from a term and ids that have already passed
 * `productSearch`. The term cannot contain filter punctuation, and every id is a UUID.
 */
export function postgrestSearchOr(term: string, categoryIds: readonly string[]) {
  if (!safeTerm.test(term) || categoryIds.length === 0 || categoryIds.some((id) => !uuid.test(id))) {
    throw new Error("Refusing to build a catalogue search filter.");
  }
  return `search_vector.wfts(simple)."${term}",category_id.in.(${categoryIds.join(",")})`;
}

export function cataloguePageState(total: number, page: number, size: number) {
  const pageCount = total > 0 ? Math.ceil(total / size) : 0;
  return {
    pageCount,
    outOfRange: total > 0 && page > pageCount,
  };
}
