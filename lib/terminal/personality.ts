/**
 * AI Tom personality wrapper for terminal outputs.
 *
 * Use tom.* phrase builders for conversational, friendly responses.
 * Bypass: use plain text("...") or hint("...") without tom.* for system-style
 * output (e.g. raw logs, debug, or minimal UX).
 */

/** Options when wrapping content in AI Tom tone. */
export interface FriendlyOptions {
  /** Add a single emoji or symbol sparingly. Default true for main replies. */
  emoji?: boolean;
}

/**
 * Wrap a short message in a friendly, conversational tone.
 * Use for one-off lines when no phrase builder exists.
 */
export function friendly(content: string, options?: FriendlyOptions): string {
  const { emoji = false } = options ?? {};
  let out = content.trim();
  if (!out.endsWith(".") && !out.endsWith("!") && !out.endsWith("?")) out += ".";
  if (emoji) out += " ✨";
  return out;
}

/** AI Tom phrase builders — short, friendly, natural. Use sparing emoji. */
export const tom = {
  empty: () => "Type a command. Try help.",
  unknown: (cmd: string) => `Unknown command: ${cmd}. Type help for commands.`,
  didYouMean: (suggestion: string) => `Did you mean '${suggestion}'?`,

  home: () => "Sure! Taking you home.",
  projects: () => "Sure! Here are Tom's projects — some of his biggest builds live here.",
  projectsList: () => "Pick one to dive in.",
  skills: () => "Tom's skills (the short list):",
  lab: () => "Here's Tom's Lab — where he experiments with new ideas.",
  labList: () => "Open Lab when you're ready.",
  lifestyle: () => "Taking you to Lifestyle — life beyond the screen.",
  contact: () => "Here's how to get in touch with Tom.",

  openProject: (title: string) => `Opening "${title}" — enjoy.`,
  openRoute: (path: string) => `Opening ${path}.`,
  openUsage: () =>
    "Usage: open <project-slug>. Or use home, projects, lab, lifestyle, contact to jump there.",

  qualitySet: (mode: string) => `Visual quality set to ${mode.toUpperCase()}.`,
  qualityAuto: () => "I'll adapt to your device — no sweat.",
  qualityOther: () => "Looking good.",

  perfOn: () => "Performance mode on — reduced visuals to keep things smooth.",
  perfOnSaved: () => "Your previous quality is saved; say perf off to restore it.",
  perfOff: () => "Performance mode off. Restored your visuals.",
  perfRestored: (mode: string) => `Visual quality set to ${mode.toUpperCase()}.`,

  exploreGuided: () => "Explore mode set to GUIDED.",
  exploreGuidedDesc: () => "I'll take you along a path — sit back and enjoy the ride.",
  exploreFree: () => "Explore mode set to FREE.",
  exploreFreeDesc: () => "You're in control — orbit and zoom however you like.",

  aboutTom: () =>
    "Tom is the human behind FocusedOnTom — creative dev, builder, and the one who keeps this ship running.",
  aboutTomMore: () =>
    "This terminal is your shortcut to his work: projects, lab experiments, and a bit of personality. Type help to see what you can do.",

  explain: (topic: string) => [
    `Sure! "${topic}" — it's part of the FocusedOnTom experience. I can point you around; try the nav commands or about tom.`,
    `Good question. "${topic}" — I'm AI Tom in spirit: friendly and rule-based. Use help to see what you can do from here.`,
    `Re: ${topic} — keeping it minimal and useful. Navigate with home, projects, lab, lifestyle, contact, or open <slug>.`,
  ],

  helpHint: () => "Tab autocomplete · ↑/↓ history",
  tryAbout: () => "Try: about tom",
  usageQuality: () => "Usage: quality <auto|high|medium|low>",
  usagePerf: () => "Usage: perf <on|off>",
  usageExplore: () => "Usage: explore <guided|free>",
  usageSudo: () => "Unknown sudo command. Try: sudo dev-mode",

  devModeOn: () => "Dev mode unlocked. You're in the loop — no dangerous actions, just good vibes. 🔓",
  devModeOff: () => "Dev mode off. 🔒",
} as const;
