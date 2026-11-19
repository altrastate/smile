"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Overview", exact: true },
  { href: "/dashboard/storefront", label: "Storefront", exact: false },
  { href: "/dashboard/products", label: "Listings", exact: false },
  { href: "/dashboard/settings", label: "Settings", exact: false },
];

export function WorkspaceNav({ name, approval }: { name: string; approval: string }) {
  const pathname = usePathname();
  return (
    <aside className="min-w-0">
      <p className="font-serif text-2xl text-forest-900">{name}</p>
      <p className="mt-1 text-sm font-semibold text-forest-800">Approval: {approval}</p>
      <nav aria-label="Producer workspace" className="mt-4 flex gap-2 overflow-x-auto md:flex-col">
        {links.map((link) => {
          const current = link.exact ? pathname === link.href : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={current ? "page" : undefined}
              className={cn(
                "inline-flex min-h-11 shrink-0 items-center px-3 text-sm font-semibold text-forest-800",
                current ? "bg-beige-200" : "hover:bg-ivory-100",
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
