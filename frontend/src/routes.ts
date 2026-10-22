export const pages = {
  "/": { load: () => import("./pages/HomePage"), bodyClass: "" },
  "/tools/": {
    load: () => import("./pages/ToolsPage"),
    bodyClass: "tools-page",
  },
  "/minecraft/boat-motors/": {
    load: () => import("./pages/MinecraftBoatMotorsPage"),
    bodyClass: "minecraft-guide",
  },
  "/minecraft/boat-motors/wiki/": {
    load: () => import("./pages/MinecraftBoatMotorsWikiPage"),
    bodyClass: "minecraft-guide",
  },
  "/minecraft/": {
    load: () => import("./pages/MinecraftPage"),
    bodyClass: "minecraft-home",
  },
  "/minecraft/nuclear-strike/": {
    load: () => import("./pages/MinecraftNuclearStrikePage"),
    bodyClass: "minecraft-guide",
  },
  "/minecraft/nuclear-strike/wiki/": {
    load: () => import("./pages/MinecraftNuclearStrikeWikiPage"),
    bodyClass: "minecraft-guide",
  },
  "/minecraft/rocket-rpg/": {
    load: () => import("./pages/MinecraftRocketRpgPage"),
    bodyClass: "minecraft-guide",
  },
  "/minecraft/rocket-rpg/wiki/": {
    load: () => import("./pages/MinecraftRocketRpgWikiPage"),
    bodyClass: "minecraft-guide",
  },
} as const;
