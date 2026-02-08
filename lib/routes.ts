export const ROUTES = {
  home: "/",
  projects: "/projects",
  project: (slug: string) => `/projects/${slug}`,
  skills: "/skills",
  lab: "/lab",
  lifestyle: "/lifestyle",
  contact: "/contact",
} as const;

export type RouteKey = keyof typeof ROUTES;

/** Routes that use Lenis smooth scroll (cinematic experience). */
export const LENIS_ROUTES: string[] = ["/", "/projects", "/skills", "/lab", "/lifestyle", "/contact"];

export function isLenisRoute(pathname: string): boolean {
  return LENIS_ROUTES.some((route) => pathname === route || pathname.startsWith(route + "/"));
}

/** Routes that show the 3D universe background. */
export const UNIVERSE_ROUTES: string[] = ["/", "/projects", "/skills", "/lab", "/lifestyle", "/contact"];

export function isUniverseRoute(pathname: string): boolean {
  if (pathname === "/" || pathname === "") return true;
  if (pathname.startsWith("/projects")) return true;
  return UNIVERSE_ROUTES.some((route) => pathname === route);
}
