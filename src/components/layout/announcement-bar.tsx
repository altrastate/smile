import { site } from "@/config/site";

export function AnnouncementBar() {
  if (!site.announcement) {
    return null;
  }

  return (
    <p className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 bg-forest-950 px-[clamp(0.75rem,3vw,1.5rem)] py-2 text-center text-[0.8125rem] leading-snug text-ivory-50 sm:text-sm">
      <span>{site.announcement}</span>
      <a href={site.phoneHref} className="font-semibold underline decoration-beige-300 underline-offset-4">
        {site.phone}
      </a>
    </p>
  );
}
