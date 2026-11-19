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
    <article className="photo-frame lift h-full overflow-hidden border border-beige-300 bg-ivory-50 shadow-soft">
      <Link href={href} className="flex h-full flex-col">
        {imageSrc ? (
          <div className="relative aspect-[4/5] overflow-hidden bg-ivory-100 sm:aspect-square">
            <Image
              src={imageSrc}
              alt={imageAlt || name}
              fill
              quality={90}
              sizes="(min-width: 1100px) 24rem, (min-width: 540px) 50vw, 100vw"
              className="object-contain p-3 sm:p-4"
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
        <div className="flex flex-1 flex-col gap-2 p-4 sm:p-5">
          {category ? <p className="text-sm font-semibold text-botanical-700">{category}</p> : null}
          <h2 className="font-serif text-[clamp(1.35rem,1.1rem+0.8vw,1.75rem)] leading-tight text-forest-900">{name}</h2>
          {business ? <p className="text-sm text-charcoal-700">{business}</p> : null}
          {summary ? <p className="text-base leading-relaxed text-charcoal-700">{summary}</p> : null}
          <p className="mt-auto pt-3 text-sm font-semibold text-forest-800">View the pack</p>
        </div>
      </Link>
    </article>
  );
}
