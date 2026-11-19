"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { primaryNavigation } from "@/config/routes";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function MobileNav({
  accountHref,
  accountLabel,
  review,
  workspace,
}: {
  accountHref: string;
  accountLabel: string;
  review: boolean;
  workspace: boolean;
}) {
  const pathname = usePathname();
  const items = primaryNavigation();
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex min-h-11 items-center border border-forest-800 px-3 text-sm font-semibold text-forest-800 lg:hidden">
        Menu
      </DialogTrigger>
      <DialogContent title="Menu" description="Pages on this site." align="end">
        <nav aria-label="Mobile">
          <ul className="flex flex-col">
            {items.map((item) => {
              const current = pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    href={item.path}
                    aria-current={current ? "page" : undefined}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex min-h-11 items-center px-1 text-base font-semibold text-forest-800",
                      current && "bg-beige-200",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="mt-6 border-t border-beige-300 pt-4">
            {workspace ? (
              <Link href="/dashboard" onClick={() => setOpen(false)} className="flex min-h-11 items-center px-1 text-base font-semibold text-forest-800">
                Workspace
              </Link>
            ) : null}
            {review ? (
              <Link href="/review" onClick={() => setOpen(false)} className="flex min-h-11 items-center px-1 text-base font-semibold text-forest-800">
                Review
              </Link>
            ) : null}
            <Link href={accountHref} onClick={() => setOpen(false)} className="flex min-h-11 items-center px-1 text-base font-semibold text-forest-800">
              {accountLabel}
            </Link>
          </div>
        </nav>
      </DialogContent>
    </Dialog>
  );
}
