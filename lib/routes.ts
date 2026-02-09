export const ROUTES = {
  home: "/",
  projects: "/dev",
  project: (slug: string) => `/dev/${slug}`,
  skills: "/skills",
  photography: "/photography",
  contact: "/contact",
} as const;
