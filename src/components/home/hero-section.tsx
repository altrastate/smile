import Image from "next/image";
import { Container } from "@/components/layout/container";
import { LinkButton } from "@/components/shared/link-button";
import { site } from "@/config/site";

export function HeroSection() {
  return (
    <section className="bg-forest-950 text-ivory-50">
      <Container className="grid items-center gap-8 py-[clamp(2.75rem,8vw,6.5rem)] min-[900px]:grid-cols-[1.05fr_0.95fr] min-[900px]:gap-12">
        <div className="rise">
          <p className="text-xs font-semibold tracking-[0.18em] text-beige-200 uppercase sm:text-sm">Kampala · East Africa</p>
          <h1 className="display-xl mt-4 max-w-xl text-ivory-50">Nature&apos;s goodness. Connected.</h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-beige-200 sm:text-lg">
            A house catalogue of herbal and nutraceutical packs from Smile Nutraceuticals, prepared for buyers,
            producers, and partners across East Africa.
          </p>
          <div className="mt-8 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 min-[900px]:flex">
            <LinkButton href="/shop" tone="outline" className="w-full min-[900px]:w-auto">
              Browse the catalogue
            </LinkButton>
            <LinkButton href="/contact" tone="inverse" className="w-full min-[900px]:w-auto">
              Visit the showroom
            </LinkButton>
          </div>
          <p className="mt-8 max-w-sm text-sm leading-relaxed text-beige-200">{site.address}</p>
        </div>
        <div className="photo-frame rise rise-late overflow-hidden border border-forest-800 bg-forest-900 shadow-soft">
          <Image
            src="/catalogue/smile-mosquito-jelly.jpg"
            alt="Smile mosquito repellent and skin care jelly, 100 grams."
            width={1039}
            height={1080}
            priority
            quality={90}
            sizes="(min-width: 900px) 36rem, 100vw"
            className="h-auto max-h-[min(78vw,36rem)] w-full object-contain"
          />
        </div>
      </Container>
    </section>
  );
}
