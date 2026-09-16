export const EXPLORE_NAV = [
  { href: "/explore", label: "Map" },
  { href: "/explore/places", label: "Places" },
  { href: "/explore/trips", label: "Trips" },
  { href: "/explore/collections", label: "Collections" },
  { href: "/explore/community", label: "Community" },
  { href: "/explore/progress", label: "My Progress" },
] as const;

export const STATUS_COLORS = {
  visited: "#7c6cff",
  want_to_visit: "#e8c36a",
  unvisited: "#9aa4af",
} as const;
