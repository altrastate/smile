/** Discovery themes for the public homepage. These are not catalogue records. */
export const discoveryThemes = [
  {
    title: "Natural foods",
    text: "Foods from farms and producers.",
  },
  {
    title: "Herbal products",
    text: "Preparations made from plants.",
  },
  {
    title: "Nutritional supplements",
    text: "Products intended to supplement the diet.",
  },
  {
    title: "Botanical ingredients",
    text: "Materials for makers and manufacturers.",
  },
  {
    title: "Organic agricultural products",
    text: "Crops and produce from growers.",
  },
  {
    title: "Natural personal care",
    text: "Care products based on natural ingredients.",
  },
] as const;

export const ecosystemRoles = [
  { title: "Producers", text: "Grow and prepare natural goods." },
  { title: "Manufacturers", text: "Make finished products." },
  { title: "Suppliers", text: "Provide ingredients and materials." },
  { title: "Distributors", text: "Move goods toward buyers." },
  { title: "Service providers", text: "Offer services the trade needs." },
  { title: "Buyers", text: "People and businesses looking for products." },
] as const;
