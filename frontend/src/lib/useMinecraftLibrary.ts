import { useState } from "react";

export function useMinecraftLibrary(
  mods: readonly (readonly [string, string])[] = [],
  recipes: readonly string[] = [],
) {
  const [query, setQuery] = useState(""),
    [category, setCategory] = useState("all"),
    [copyStatus, setCopyStatus] = useState("");
  const search = query.trim().toLowerCase();
  const matchesMod = (kind: string, text: string) =>
    (category === "all" || category === kind) &&
    text.toLowerCase().includes(search);
  const matchesRecipe = (text: string) => text.toLowerCase().includes(search);
  async function copyCommand(command: string) {
    try {
      await navigator.clipboard.writeText(command);
      setCopyStatus("Command copied. Paste it into Minecraft chat.");
    } catch {
      setCopyStatus(
        "Copy was unavailable. Select the command text and copy it manually.",
      );
    }
  }
  return {
    query,
    setQuery,
    category,
    setCategory,
    copyStatus,
    copyCommand,
    matchesMod,
    matchesRecipe,
    visibleMods: mods.filter(([kind, text]) => matchesMod(kind, text)).length,
    visibleRecipes: recipes.filter(matchesRecipe).length,
  };
}
