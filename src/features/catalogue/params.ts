export type CatalogueSort = "newest" | "name";

export type CatalogueParams = {
  q: string;
  category: string;
  sort: CatalogueSort;
  page: number;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function sanitizeSearch(value: string | undefined) {
  if (!value) {
    return "";
  }
  return value
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 80)
    .trim();
}

export function parseCatalogueParams(input: {
  q?: string | string[];
  category?: string | string[];
  sort?: string | string[];
  page?: string | string[];
}): CatalogueParams {
  const category = first(input.category) ?? "";
  const sort = first(input.sort) === "name" ? "name" : "newest";
  const pageNumber = Number(first(input.page));
  const page = Number.isInteger(pageNumber) && pageNumber >= 1 && pageNumber <= 500 ? pageNumber : 1;

  return {
    q: sanitizeSearch(first(input.q)),
    category: /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(category) ? category : "",
    sort,
    page,
  };
}

export function catalogueHref(
  pathname: string,
  params: Pick<CatalogueParams, "q" | "category" | "sort"> & { page?: number },
) {
  const search = new URLSearchParams();
  if (params.q) {
    search.set("q", params.q);
  }
  if (params.category) {
    search.set("category", params.category);
  }
  if (params.sort === "name") {
    search.set("sort", "name");
  }
  if (params.page && params.page > 1) {
    search.set("page", String(params.page));
  }
  const query = search.toString();
  return query ? `${pathname}?${query}` : pathname;
}
