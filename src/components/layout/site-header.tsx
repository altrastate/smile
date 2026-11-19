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
  let workspace = false;
  if (user && supabase) {
    const roles = await supabase.from("user_roles").select("role").eq("user_id", user.id);
    review = (roles.data ?? []).some((row) => row.role === "reviewer" || row.role === "admin");
    const businesses = await supabase.rpc("producer_workspaces");
    workspace = (businesses.data ?? []).some(
      (row) => row.business_kind === "producer" && row.approval_status === "approved",
    );
  }

  return (
    <header className="sticky top-0 z-40 border-b border-beige-300/80 bg-ivory-50/92 backdrop-blur-md supports-[padding:max(0px)]:pt-[env(safe-area-inset-top)]">
      <AnnouncementBar />
      <div className="mx-auto flex w-full max-w-[76rem] items-center gap-2 px-[clamp(1rem,4vw,2.25rem)] py-2 sm:gap-3 sm:py-3">
        <Link href="/" className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3 min-[1180px]:flex-none">
          <Image
            src="/brand/mark.svg"
            alt=""
            width={353}
            height={270}
            priority
            unoptimized
            className="h-9 w-auto shrink-0 sm:h-11"
          />
          <span className="min-w-0">
            <span className="block truncate font-serif text-[1.05rem] leading-none text-forest-900 sm:text-[1.65rem]">
              {site.name}
            </span>
            <span className="mt-1 hidden text-sm text-charcoal-700 md:block">{site.market}</span>
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
          {workspace ? (
            <Link href="/dashboard" className="hidden min-h-11 items-center px-3 text-sm font-semibold text-forest-800 min-[1180px]:inline-flex">
              Workspace
            </Link>
          ) : null}
          {review ? (
            <Link href="/review" className="hidden min-h-11 items-center px-3 text-sm font-semibold text-forest-800 min-[1180px]:inline-flex">
              Review
            </Link>
          ) : null}
          <Link
            href={accountHref}
            className="hidden min-h-11 items-center border border-forest-800 px-3 text-sm font-semibold text-forest-800 min-[1180px]:inline-flex"
          >
            {accountLabel}
          </Link>
          <MobileNav accountHref={accountHref} accountLabel={accountLabel} review={review} workspace={workspace} />
        </div>
      </div>
    </header>
  );
}

