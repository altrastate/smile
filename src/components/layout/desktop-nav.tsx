"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { primaryNavigation } from "@/config/routes";
import { cn } from "@/lib/utils";

export function DesktopNav() {
  const pathname = usePathname();
  const items = primaryNavigation();

  return (
    <nav aria-label="Primary" className="hidden min-[1180px]:block">
      <ul className="flex items-center gap-1">
        {items.map((item) => {
          const current = pathname === item.path;
          return (
            <li key={item.path}>
              <Link
                href={item.path}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-11 items-center px-3 text-sm font-semibold text-forest-800",
                  current ? "bg-beige-200" : "hover:bg-ivory-100",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
