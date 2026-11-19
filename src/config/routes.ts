export type RouteGroup = "public" | "auth" | "customer" | "business" | "admin";

export type AppRoute = {
  path: string;
  label: string;
  group: RouteGroup;
  implemented: boolean;
};

/**
 * Route contract for later phases.
 * A route is implemented only when its page exists and this flag is true.
 * Do not link to a route while implemented is false.
 */
export const appRoutes = [
  { path: "/", label: "Home", group: "public", implemented: true },
  { path: "/shop", label: "Shop", group: "public", implemented: true },
  { path: "/shop/[slug]", label: "Product", group: "public", implemented: true },
  { path: "/categories", label: "Categories", group: "public", implemented: true },
  { path: "/categories/[slug]", label: "Category", group: "public", implemented: true },
  { path: "/businesses", label: "Businesses", group: "public", implemented: true },
  { path: "/businesses/[slug]", label: "Business", group: "public", implemented: false },
  { path: "/services", label: "Services", group: "public", implemented: true },
  { path: "/about", label: "About", group: "public", implemented: true },
  { path: "/contact", label: "Contact", group: "public", implemented: true },
  { path: "/auth/login", label: "Log in", group: "auth", implemented: false },
  { path: "/auth/register", label: "Register", group: "auth", implemented: false },
  { path: "/auth/forgot-password", label: "Forgot password", group: "auth", implemented: false },
  { path: "/account", label: "Account", group: "customer", implemented: false },
  { path: "/account/orders", label: "Orders", group: "customer", implemented: false },
  { path: "/account/profile", label: "Profile", group: "customer", implemented: false },
  { path: "/business", label: "Business", group: "business", implemented: false },
  { path: "/business/onboarding", label: "Business onboarding", group: "business", implemented: false },
  { path: "/business/dashboard", label: "Business dashboard", group: "business", implemented: false },
  { path: "/business/products", label: "Business products", group: "business", implemented: false },
  { path: "/business/orders", label: "Business orders", group: "business", implemented: false },
  { path: "/business/settings", label: "Business settings", group: "business", implemented: false },
  { path: "/admin", label: "Administration", group: "admin", implemented: false },
  { path: "/admin/businesses", label: "Review businesses", group: "admin", implemented: false },
  { path: "/admin/products", label: "Review products", group: "admin", implemented: false },
  { path: "/admin/orders", label: "Review orders", group: "admin", implemented: false },
  { path: "/admin/settings", label: "Admin settings", group: "admin", implemented: false },
] as const satisfies readonly AppRoute[];

const primaryPaths = ["/", "/shop", "/categories", "/businesses", "/services", "/about"] as const;

export function implementedRoutes() {
  return appRoutes.filter((route) => route.implemented);
}

export function primaryNavigation() {
  return primaryPaths.map((path) => {
    const route = appRoutes.find((item) => item.path === path);
    if (!route?.implemented) {
      throw new Error(`Primary navigation includes an unimplemented route: ${path}`);
    }
    return route;
  });
}
