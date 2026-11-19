import { site } from "@/config/site";

export function AnnouncementBar() {
  if (!site.announcement) {
    return null;
  }

  return (
    <p className="bg-forest-800 px-5 py-2 text-center text-sm text-ivory-50">{site.announcement}</p>
  );
}
