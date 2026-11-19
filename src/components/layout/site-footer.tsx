import { site } from "@/config/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-beige-300">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-8 text-sm text-charcoal-700 md:flex-row md:items-center md:justify-between">
        <p>{site.name}</p>
        <p>Developed by {site.developer}</p>
      </div>
    </footer>
  );
}
