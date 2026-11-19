import Image from "next/image";
import Link from "next/link";

export type ProductCardProps = {
  name: string;
  imageSrc: string;
  imageAlt: string;
  priceLabel?: string;
  availability?: string;
  href?: string;
};

export function ProductCard({ name, imageSrc, imageAlt, priceLabel, availability, href }: ProductCardProps) {
  const body = (
    <>
      <div className="relative aspect-square bg-ivory-100">
        <Image src={imageSrc} alt={imageAlt} fill className="object-cover" sizes="(min-width: 1024px) 20rem, 100vw" />
      </div>
      <div className="flex flex-col gap-2 border-t border-beige-200 p-4">
        <h3 className="font-serif text-xl text-forest-900">{name}</h3>
        {priceLabel ? <p className="text-base font-semibold text-charcoal-900">{priceLabel}</p> : null}
        {availability ? <p className="text-sm text-charcoal-700">{availability}</p> : null}
      </div>
    </>
  );

  const className = "block border border-beige-300 bg-ivory-50";

  if (href) {
    return (
      <article>
        <Link href={href} className={className}>
          {body}
        </Link>
      </article>
    );
  }

  return <article className={className}>{body}</article>;
}
