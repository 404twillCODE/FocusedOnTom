export const ROUTES = {
  home: "/",
  projects: "/projects",
  project: (slug: string) => `/projects/${slug}`,
  lab: "/lab",
  lifestyle: "/lifestyle",
  contact: "/contact",
} as const;

export type RouteKey = keyof typeof ROUTES;

/** Routes that use Lenis smooth scroll (cinematic experience). */
export const LENIS_ROUTES: string[] = ["/", "/projects", "/lab", "/lifestyle", "/contact"];

export function isLenisRoute(pathname: string): boolean {
  return LENIS_ROUTES.some((route) => pathname === route || pathname.startsWith(route + "/"));
}
