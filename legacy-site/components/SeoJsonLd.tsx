import { PHOTO_BRAND } from "@/lib/photography-config";
import { PHOTOGRAPHY_INSTAGRAM_URL } from "@/lib/social-links";
import { absoluteUrl } from "@/lib/site-url";

/**
 * Organization + WebSite JSON-LD for Google rich results and knowledge panels.
 */
export function SeoJsonLd() {
  const site = absoluteUrl("/");
  const logo = absoluteUrl("/logo.png");

  const graph = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${site}#website`,
      name: "Focused on Tom",
      url: site,
      description:
        "Portfolio of Tom Williams — car and automotive photography, landscape and street photography, and web development. Book shoots and browse galleries.",
      inLanguage: "en-US",
      publisher: { "@id": `${site}#person` },
      potentialAction: {
        "@type": "ReadAction",
        target: absoluteUrl("/photography"),
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "Person",
      "@id": `${site}#person`,
      name: "Tom Williams",
      url: site,
      image: logo,
      email: PHOTO_BRAND.contactEmail,
      jobTitle: "Photographer & web developer",
      sameAs: [
        PHOTOGRAPHY_INSTAGRAM_URL,
        "https://github.com/404twillCODE",
        "https://www.linkedin.com/in/thomas-williams-a32130350/",
      ],
      knowsAbout: [
        "Automotive photography",
        "Car photography",
        "Web development",
        "Portrait photography",
      ],
    },
  ];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
