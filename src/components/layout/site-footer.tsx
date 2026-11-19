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
    <footer className="border-t border-beige-300 bg-ivory-100">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-serif text-2xl text-forest-900">{site.name}</p>
          <p className="mt-3 text-sm leading-relaxed text-charcoal-700">{site.tagline}</p>
        </div>
        <nav aria-label="Marketplace">
          <p className="text-sm font-semibold tracking-[0.16em] text-botanical-700 uppercase">Marketplace</p>
          <ul className="mt-3 space-y-1">
            {marketplace.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="inline-flex min-h-11 items-center text-sm text-forest-800">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Business participation">
          <p className="text-sm font-semibold tracking-[0.16em] text-botanical-700 uppercase">For businesses</p>
          <ul className="mt-3">
            <li>
              <Link href="/#participate" className="inline-flex min-h-11 items-center text-sm text-forest-800">
                How businesses can take part
              </Link>
            </li>
          </ul>
        </nav>
        <div>
          <p className="text-sm font-semibold tracking-[0.16em] text-botanical-700 uppercase">Company</p>
          <ul className="mt-3 space-y-1">
            <li>
              <Link href="/about" className="inline-flex min-h-11 items-center text-sm text-forest-800">
                About
              </Link>
            </li>
            <li>
              <Link href="/contact" className="inline-flex min-h-11 items-center text-sm text-forest-800">
                Contact
              </Link>
            </li>
          </ul>
          <p className="mt-4 text-sm text-charcoal-700">Developed by {site.developer}</p>
        </div>
      </div>
    </footer>
  );
}
