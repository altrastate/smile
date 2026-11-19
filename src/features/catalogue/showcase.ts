import type { CatalogueProductDetail } from "@/features/catalogue/queries";

export const showcaseBusiness = {
  name: "Smile Nutraceuticals",
  slug: "smile-nutraceuticals",
  description:
    "House range photographed for Smile Nutraceuticals in Kampala. Pack sizes are taken from the labels. Prices are not shown.",
  location: "Kyebando Ring Road, next to Handsome Petrol Station, Kampala, Uganda",
} as const;

const house = {
  businessName: showcaseBusiness.name,
  businessSlug: showcaseBusiness.slug,
  brandName: "Smile Nutraceuticals",
  manufacturerName: "Smile Nutraceuticals",
  origin: "Uganda",
  ingredients: null,
};

function item(
  product: Omit<CatalogueProductDetail, "businessName" | "businessSlug" | "brandName" | "manufacturerName" | "origin" | "ingredients" | "images" | "image"> & {
    imageSrc: string;
  },
): CatalogueProductDetail {
  const image = { src: product.imageSrc, alt: `${product.name} pack` };
  return {
    ...house,
    id: product.id,
    name: product.name,
    slug: product.slug,
    summary: product.summary,
    description: product.description,
    categoryName: product.categoryName,
    categorySlug: product.categorySlug,
    productType: product.productType,
    image,
    images: [image],
  };
}

export const showcaseProducts: CatalogueProductDetail[] = [
  item({
    id: "showcase-diabex",
    name: "Diabex Tincture",
    slug: "diabex-tincture",
    summary: "50 ml tincture. The pack is marked 100% natural.",
    description: "Smile Nutraceuticals Diabex Tincture in a 50 ml dropper bottle, shown with its carton.",
    categoryName: "Herbal products",
    categorySlug: "herbal-products",
    productType: "50 ml tincture",
    imageSrc: "/catalogue/diabex-tincture.jpg",
  }),
  item({
    id: "showcase-ulceri",
    name: "Betta Ulceri Tonic",
    slug: "betta-ulceri-tonic",
    summary: "200 ml tonic from the Smile Nutraceuticals house range.",
    description: "Betta Ulceri Tonic, 200 ml, produced by Smile Nutraceuticals Limited in Kampala.",
    categoryName: "Herbal products",
    categorySlug: "herbal-products",
    productType: "200 ml tonic",
    imageSrc: "/catalogue/betta-ulceri-tonic.jpg",
  }),
  item({
    id: "showcase-pressure",
    name: "HB Pressure Tone",
    slug: "hb-pressure-tone",
    summary: "Herbal formula. The label reads 100% natural extract.",
    description: "HB Pressure Tone herbal formula. The label describes it as a natural extract.",
    categoryName: "Herbal products",
    categorySlug: "herbal-products",
    productType: "Herbal formula",
    imageSrc: "/catalogue/hb-pressure-tone.jpg",
  }),
  item({
    id: "showcase-jelly",
    name: "Smile Mosquito Repellent Jelly",
    slug: "smile-mosquito-repellent-jelly",
    summary: "100 g skin-applied jelly. The label says 8 hours of protection.",
    description: "Smile skin-applied mosquito repellent and skin care jelly, 100 g.",
    categoryName: "Natural personal care",
    categorySlug: "natural-personal-care",
    productType: "100 g jelly",
    imageSrc: "/catalogue/smile-mosquito-jelly.jpg",
  }),
  item({
    id: "showcase-maxma",
    name: "Maxma Fat Burner",
    slug: "maxma-fat-burner",
    summary: "Smile Nutraceuticals Maxma Fat Burner. Advanced bio formula on the label.",
    description: "Maxma Fat Burner from Smile Nutraceuticals, photographed beside SlimFast Original.",
    categoryName: "Nutritional supplements",
    categorySlug: "nutritional-supplements",
    productType: "Capsules",
    imageSrc: "/catalogue/maxma-and-slimfast.jpg",
  }),
  item({
    id: "showcase-slimfast",
    name: "SlimFast Original",
    slug: "slimfast-original",
    summary: "240 veggie capsules. The label reads 100% herbal.",
    description: "SlimFast Original, 240 veggie capsules, photographed beside Maxma Fat Burner.",
    categoryName: "Nutritional supplements",
    categorySlug: "nutritional-supplements",
    productType: "240 veggie capsules",
    imageSrc: "/catalogue/maxma-and-slimfast.jpg",
  }),
  item({
    id: "showcase-panther",
    name: "Black Panther Male Boost",
    slug: "black-panther-male-boost",
    summary: "60 capsules. The label reads 100% natural.",
    description: "Black Panther Male Boost, a 60-capsule pack marked 100% natural.",
    categoryName: "Nutritional supplements",
    categorySlug: "nutritional-supplements",
    productType: "60 capsules",
    imageSrc: "/catalogue/black-panther-male-boost.jpg",
  }),
  item({
    id: "showcase-maxpro",
    name: "Max Pro",
    slug: "max-pro",
    summary: "Max Pro capsules from the photographed house range.",
    description: "Max Pro in a black bottle with a green label.",
    categoryName: "Nutritional supplements",
    categorySlug: "nutritional-supplements",
    productType: "Capsules",
    imageSrc: "/catalogue/max-pro.jpg",
  }),
  item({
    id: "showcase-oil",
    name: "Max Enlargement Oil",
    slug: "max-enlargement-oil",
    summary: "Massage oil for men. The label reads 100% pure natural.",
    description: "Max Enlargement Oil, a dropper bottle photographed with Max Pro.",
    categoryName: "Natural personal care",
    categorySlug: "natural-personal-care",
    productType: "Massage oil",
    imageSrc: "/catalogue/max-enlargement-oil.jpg",
  }),
  item({
    id: "showcase-malemax",
    name: "Smile Male Max Syrup",
    slug: "smile-male-max-syrup",
    summary: "Smile Nutraceuticals syrup. The label reads 100% natural.",
    description: "Smile Male Max Syrup from Smile Nutraceuticals.",
    categoryName: "Nutritional supplements",
    categorySlug: "nutritional-supplements",
    productType: "Syrup",
    imageSrc: "/catalogue/smile-male-max-syrup.jpg",
  }),
];

export function filterShowcase(input: { q?: string; category?: string; sort?: "newest" | "name" }) {
  const query = input.q?.trim().toLowerCase() ?? "";
  const matched = showcaseProducts.filter((product) => {
    if (input.category && product.categorySlug !== input.category) {
      return false;
    }
    if (!query) {
      return true;
    }
    const haystack = `${product.name} ${product.summary ?? ""} ${product.categoryName}`.toLowerCase();
    return haystack.includes(query);
  });
  if (input.sort === "name") {
    return [...matched].sort((a, b) => a.name.localeCompare(b.name) || a.slug.localeCompare(b.slug));
  }
  return matched;
}

export function findShowcase(slug: string) {
  return showcaseProducts.find((product) => product.slug === slug) ?? null;
}
