import type { Metadata } from "next";
import Image from "next/image";
import { PageHero } from "@/components/PageHero";
import { Reveal } from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Photos",
  description: "Photography — cars, landscapes, wildlife, nights, and the details in between.",
};

const photos = [
  {
    src: "/images/photography/recent-2.jpg",
    alt: "Landscape at golden hour",
    tall: true,
  },
  {
    src: "/images/photography/card.jpg",
    alt: "Camera lens close-up",
    tall: false,
  },
  {
    src: "/images/photography/recent-1.jpg",
    alt: "Automotive detail",
    tall: false,
  },
  {
    src: "/images/hero/hero.jpg",
    alt: "Mountain overlook",
    tall: true,
  },
];

export default function PhotosPage() {
  return (
    <>
      <PageHero
        eyebrow="VISUAL STORIES"
        title="Photography"
        accent="gallery."
        description="A growing collection of moments — wildlife, cars, landscapes, nights, and whatever else catches my eye. Swap in your real shots when you're ready."
      />
      <section className="pb-28">
        <div className="container-page columns-1 gap-5 sm:columns-2 lg:columns-3">
          {photos.map((photo, i) => (
            <Reveal key={photo.src} delay={i * 0.06} className="mb-5 break-inside-avoid">
              <figure
                className={`relative overflow-hidden rounded-[16px] border border-white/10 ${
                  photo.tall ? "aspect-[3/4]" : "aspect-[4/3]"
                }`}
              >
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover"
                />
              </figure>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
