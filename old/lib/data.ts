export type CategoryCardData = {
  href: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  icon: "mountain" | "camera" | "code";
  number: string;
};

export const categories: CategoryCardData[] = [
  {
    href: "/projects",
    title: "Projects",
    description: "Websites, apps, and experiments I'm building.",
    image: "/images/projects/card.jpg",
    imageAlt: "Code on a computer screen",
    icon: "code",
    number: "01",
  },
  {
    href: "/photos",
    title: "Photography",
    description: "Cars, landscapes, and the moments in between.",
    image: "/images/photography/card.jpg",
    imageAlt: "Close-up of a camera lens",
    icon: "camera",
    number: "02",
  },
  {
    href: "/explore",
    title: "Exploring",
    description: "Explore New York — parks, campsites, and trips on the map.",
    image: "/images/explore/card.jpg",
    imageAlt: "Snowy mountain peaks under a dark sky",
    icon: "mountain",
    number: "03",
  },
];

export type RecentItem = {
  href: string;
  title: string;
  tag: string;
  image: string;
  imageAlt: string;
  size: "large" | "small";
};

export const recentItems: RecentItem[] = [
  {
    href: "/photos",
    title: "Golden hour overlook",
    tag: "Photography",
    image: "/images/photography/recent-2.jpg",
    imageAlt: "Landscape at golden hour",
    size: "large",
  },
  {
    href: "/projects",
    title: "Nodexity",
    tag: "Code",
    image: "/images/projects/recent-1.jpg",
    imageAlt: "Laptop with code on screen",
    size: "small",
  },
  {
    href: "/explore",
    title: "Forest trail morning",
    tag: "Explore",
    image: "/images/explore/recent-1.jpg",
    imageAlt: "Sunlight through a forest trail",
    size: "large",
  },
  {
    href: "/photos",
    title: "Night details",
    tag: "Photography",
    image: "/images/photography/recent-1.jpg",
    imageAlt: "Car photography detail shot",
    size: "small",
  },
];

export const navLinks = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Projects" },
  { href: "/photos", label: "Photos" },
  { href: "/explore", label: "Explore NY" },
  { href: "/contact", label: "Contact" },
] as const;
