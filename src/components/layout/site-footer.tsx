import Link from "next/link";
import { site } from "@/config/site";

const marketplace = [
  { href: "/shop", label: "Shop" },
  { href: "/categories", label: "Categories" },
  { href: "/businesses", label: "Businesses" },
  { href: "/services", label: "Services" },
] as const;

export function SiteFooter() {
  return (
    <footer className="bg-forest-950 pb-[max(0px,env(safe-area-inset-bottom))] text-ivory-50">
      <div className="mx-auto grid w-full max-w-[76rem] gap-8 px-[clamp(1rem,4vw,2.25rem)] py-[clamp(2.5rem,6vw,4rem)] sm:grid-cols-2 lg:grid-cols-4 lg:gap-10">
        <div>
          <p className="font-serif text-[clamp(1.6rem,1.2rem+1.4vw,2rem)]">{site.name}</p>
          <p className="mt-3 text-sm leading-relaxed text-beige-200">{site.tagline}</p>
          <p className="mt-4 text-sm leading-relaxed text-beige-200">{site.address}</p>
        </div>
        <nav aria-label="Marketplace">
          <p className="text-sm font-semibold tracking-[0.16em] text-beige-200 uppercase">Marketplace</p>
          <ul className="mt-3 space-y-1">
            {marketplace.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="inline-flex min-h-11 items-center text-sm text-ivory-50">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Business participation">
          <p className="text-sm font-semibold tracking-[0.16em] text-beige-200 uppercase">For businesses</p>
          <ul className="mt-3">
            <li>
              <Link href="/#participate" className="inline-flex min-h-11 items-center text-sm text-ivory-50">
                How businesses can take part
              </Link>
            </li>
          </ul>
        </nav>
        <div>
          <p className="text-sm font-semibold tracking-[0.16em] text-beige-200 uppercase">Showroom</p>
          <ul className="mt-3 space-y-1">
            <li>
              <Link href="/about" className="inline-flex min-h-11 items-center text-sm text-ivory-50">
                About
              </Link>
            </li>
            <li>
              <Link href="/contact" className="inline-flex min-h-11 items-center text-sm text-ivory-50">
                Contact
              </Link>
            </li>
            <li>
              <a href={site.phoneHref} className="inline-flex min-h-11 items-center text-sm font-semibold text-ivory-50">
                {site.phone}
              </a>
            </li>
            <li>
              <a href={`mailto:${site.email}`} className="inline-flex min-h-11 items-center text-sm break-all text-ivory-50">
                {site.email}
              </a>
            </li>
          </ul>
          <p className="mt-4 text-sm text-beige-200">Developed by {site.developer}</p>
        </div>
      </div>
    </footer>
  );
}
