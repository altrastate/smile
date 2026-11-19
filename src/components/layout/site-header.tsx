import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { DesktopNav } from "@/components/layout/desktop-nav";
import { MobileNav } from "@/components/layout/mobile-nav";
import { SearchDialog } from "@/components/layout/search-dialog";
import { site } from "@/config/site";
import { getSessionUser } from "@/features/auth/session";

export async function SiteHeader() {
  const { supabase, user } = await getSessionUser();
  const accountHref = user ? "/account" : "/login";
  const accountLabel = user ? "Account" : "Log in";
  let review = false;
  if (user) {
    const roles = await supabase.from("user_roles").select("role").eq("user_id", user.id);
    review = (roles.data ?? []).some((row) => row.role === "reviewer" || row.role === "admin");
  }

  return (
    <header className="border-b border-beige-300 bg-ivory-50">
      <AnnouncementBar />
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-3 px-5 py-3">
        <Link href="/" className="flex min-w-0 basis-full items-center gap-3 sm:basis-auto sm:flex-1">
          <Image
            src="/brand/mark.svg"
            alt=""
            width={353}
            height={270}
            priority
            unoptimized
            className="h-12 w-auto shrink-0"
          />
          <span className="min-w-0">
            <span className="block font-serif text-lg leading-tight text-forest-900 sm:text-2xl">{site.name}</span>
            <span className="mt-1 hidden text-sm text-charcoal-700 sm:block">{site.market}</span>
          </span>
        </Link>
        <DesktopNav />
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Suspense
            fallback={
              <span className="inline-flex min-h-11 items-center border border-forest-800 px-3 text-sm font-semibold text-forest-800">
                Search
              </span>
            }
          >
            <SearchDialog />
          </Suspense>
          {review ? (
            <Link href="/review" className="hidden min-h-11 items-center px-3 text-sm font-semibold text-forest-800 lg:inline-flex">
              Review
            </Link>
          ) : null}
          <Link
            href={accountHref}
            className="hidden min-h-11 items-center border border-forest-800 px-3 text-sm font-semibold text-forest-800 lg:inline-flex"
          >
            {accountLabel}
          </Link>
          <MobileNav accountHref={accountHref} accountLabel={accountLabel} review={review} />
        </div>
      </div>
    </header>
  );
}

