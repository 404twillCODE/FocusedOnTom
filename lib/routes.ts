export const ROUTES = {
  home: "/",
  projects: "/dev",
  project: (slug: string) => `/dev/${slug}`,
  skills: "/skills",
  photography: "/photography",
  websites: "/websites",
  websitesPayment: "/websites/payment",
  contact: "/contact",
} as const;
