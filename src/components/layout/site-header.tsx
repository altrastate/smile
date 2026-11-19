import Image from "next/image";
import Link from "next/link";
import { site } from "@/config/site";

export function SiteHeader() {
  return (
    <header className="border-b border-beige-300">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-4">
        <Link href="/" className="flex items-center gap-4">
          <Image
            src="/brand/mark.svg"
            alt=""
            width={353}
            height={270}
            priority
            unoptimized
            className="h-16 w-auto"
          />
          <span>
            <span className="block font-serif text-2xl leading-none text-forest-900">{site.name}</span>
            <span className="mt-1 block text-sm text-charcoal-700">{site.market}</span>
          </span>
        </Link>
      </div>
    </header>
  );
}
