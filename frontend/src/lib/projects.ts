export type Project = {
  id: string;
  name: string;
  category: string;
  image: string;
  description: string;
  tags: string[];
  links: string[][];
  color?: string;
  detail?: string;
  notes?: string[];
};
export const projects: Project[] = [
  {
    id: "nodexity",
    name: "Nodexity",
    category: "SERVER MANAGEMENT",
    image: "/assets/projects/nodexity-site.png",
    color: "nodexity",
    description: "A calmer home for your Minecraft servers.",
    detail:
      "A Minecraft server manager that brings starting, stopping, monitoring, and configuring servers into one workspace. The idea is simple: spend less time managing the setup and more time enjoying what you host.",
    tags: ["Node.js", "Minecraft", "Server tools"],
    notes: [
      "Start and stop servers from one place.",
      "Monitor server activity and manage configuration.",
      "Built around making self-hosting easier to manage.",
    ],
    links: [["Explore Nodexity", "https://nodexity.com/"]],
  },
  {
    id: "delta",
    name: "Delta Water Explorer",
    category: "DATA & THE OUTDOORS",
    image: "/assets/projects/delta-water-explorer.webp",
    color: "delta",
    description: "A little more context for a familiar body of water.",
    detail:
      "An interactive explorer for Delta Reservoir near Rome, New York. It brings observed water levels, seasonal drawdown, and the historical record into one place, with clear sources and context.",
    tags: ["NOAA / NWPS", "USGS", "Interactive charts"],
    notes: [
      "Explore recent NOAA observations and historical USGS records.",
      "Compare seasonal drawdown, refill signals, and water-level trends.",
      "Inspect data coverage and sources behind each view.",
    ],
    links: [
      ["Explore the project", "https://delta-water-explorer.vercel.app/"],
    ],
  },
  {
    id: "galleryx",
    name: "GalleryX",
    category: "DESKTOP APP · IN DEVELOPMENT",
    image: "/assets/projects/galleryx-site.jpg",
    color: "galleryx",
    description: "Your media, right where you left it.",
    detail:
      "An offline-first photo and video browser for large libraries on internal and external drives. GalleryX indexes media where it lives, so your original files stay in place.",
    tags: ["Electron", "SQLite", "Local media"],
    notes: [
      "Indexes folders in place and builds a thumbnail cache.",
      "Photo and video galleries, favorites, timelines, and duplicate review.",
      "Cached previews stay available when an external drive is disconnected.",
    ],
    links: [
      ["View the project site", "https://galleryx-sigma.vercel.app/"],
      ["Browse my GitHub", "https://github.com/404twillCODE"],
    ],
  },
  {
    id: "minecraft",
    name: "Minecraft Mods",
    category: "EXPERIMENTS & LITTLE OBSESSIONS",
    image: "/assets/projects/minecraft-mods-site.webp",
    color: "mods",
    description: "Small changes. Entirely new ways to play.",
    detail:
      "A collection of Minecraft Java mods, from boat motors to rocket launchers. A place to experiment, learn, and build something just because it would be fun to use.",
    tags: ["Minecraft Java", "Game mechanics", "Modding"],
    notes: [
      "Boat Motors: new ways to get around on the water.",
      "Rocket RPG: a new addition to the inventory.",
      "Nuclear Strike: another experiment in game mechanics.",
    ],
    links: [
      ["Explore the mods & wikis", "/minecraft/"],
      ["Browse my GitHub", "https://github.com/404twillCODE"],
    ],
  },
  {
    id: "afterhours",
    name: "Afterhours",
    category: "GAMES & GOOD COMPANY",
    image: "/assets/projects/afterhours-site.webp",
    description: "Your favorite people. One more game.",
    tags: ["Multiplayer games", "Watch parties", "Shared rooms"],
    links: [
      ["Open Afterhours", "https://afterhours-game-night-chi.vercel.app/"],
    ],
  },
  {
    id: "tevisuals",
    name: "TE Visuals",
    category: "PHOTOGRAPHY & VIDEOGRAPHY",
    image: "/assets/projects/tevisuals-site.webp",
    description: "Two perspectives. A place to share what we create.",
    tags: ["Photography", "Videography", "Client galleries"],
    links: [["Open TE Visuals", "https://www.tevisuals.com/"]],
  },
];
const projectOrder = [
  "nodexity",
  "minecraft",
  "delta",
  "galleryx",
  "afterhours",
  "tevisuals",
];
projects.sort(
  (a, b) => projectOrder.indexOf(a.id) - projectOrder.indexOf(b.id),
);
