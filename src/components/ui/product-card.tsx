import Image from "next/image";
import Link from "next/link";

export type ProductCardProps = {
  name: string;
  href: string;
  imageSrc?: string | null;
  imageAlt?: string;
  category?: string;
  business?: string;
  summary?: string;
};

export function ProductCard({ name, href, imageSrc, imageAlt, category, business, summary }: ProductCardProps) {
  return (
    <article className="h-full border border-beige-300 bg-ivory-50">
      <Link href={href} className="flex h-full flex-col">
        {imageSrc ? (
          <div className="relative aspect-square bg-ivory-100">
            <Image
              src={imageSrc}
              alt={imageAlt || name}
              fill
              unoptimized
              sizes="(min-width: 1024px) 20rem, 100vw"
              className="object-cover"
            />
          </div>
        ) : (
          <div className="flex aspect-square items-center justify-center bg-beige-200 text-forest-800">
            <span className="font-serif text-5xl" aria-hidden="true">
              {name.slice(0, 1)}
            </span>
            <span className="sr-only">{name} has no photograph.</span>
          </div>
        )}
        <div className="flex flex-1 flex-col gap-2 p-4">
          {category ? <p className="text-sm font-semibold text-botanical-700">{category}</p> : null}
          <h2 className="font-serif text-2xl text-forest-900">{name}</h2>
          {business ? <p className="text-sm text-charcoal-700">{business}</p> : null}
          {summary ? <p className="text-base leading-relaxed text-charcoal-700">{summary}</p> : null}
        </div>
      </Link>
    </article>
  );
}
