import { ROUTES } from "@/lib/routes";
import { getProjects, getProjectBySlug, getProjectSlugs } from "@/lib/data/projects";
import { getSkills } from "@/lib/data/skills";
import { getExperiments } from "@/lib/data/experiments";
import type {
  ParsedInput,
  CommandOutput,
  RunResult,
  TerminalContext,
} from "./types";
import { tom } from "./personality";

// --- Command metadata & aliases -------------------------------------------------

export type CommandCategory =
  | "navigation"
  | "system"
  | "information"
  | "actions"
  | "secret";

export interface CommandMeta {
  name: string;
  aliases: string[];
  description: string;
  category: CommandCategory;
}

export const COMMAND_META: CommandMeta[] = [
  { name: "help", aliases: ["?"], description: "List commands by category", category: "information" },
  { name: "about", aliases: [], description: "About Tom", category: "information" },
  { name: "home", aliases: ["~", "cd"], description: "Back to the start", category: "navigation" },
  { name: "projects", aliases: ["proj", "ls", "list"], description: "See what Tom's built", category: "navigation" },
  { name: "skills", aliases: ["sk"], description: "List skills", category: "navigation" },
  { name: "lab", aliases: ["exp", "experiments"], description: "Experiments & ideas", category: "navigation" },
  { name: "lifestyle", aliases: ["life"], description: "Life beyond the screen", category: "navigation" },
  { name: "contact", aliases: ["mail", "email"], description: "Get in touch", category: "navigation" },
  { name: "open", aliases: [], description: "Open project or route by slug", category: "actions" },
  { name: "explain", aliases: ["ask"], description: "Ask AI Tom something", category: "information" },
  { name: "quality", aliases: ["q"], description: "Visual quality (auto|high|medium|low)", category: "system" },
  { name: "perf", aliases: ["perf-mode"], description: "Performance mode on|off", category: "system" },
  { name: "explore", aliases: ["cam", "camera"], description: "Camera mode guided|free", category: "system" },
  { name: "sudo", aliases: [], description: "Dev / privileged commands", category: "secret" },
];

const CANONICAL_NAMES = new Set(COMMAND_META.map((c) => c.name));

/** All strings that can invoke a command (name + every alias). */
function allCommandTokens(): string[] {
  const out: string[] = [];
  for (const c of COMMAND_META) {
    out.push(c.name);
    out.push(...c.aliases);
  }
  return [...new Set(out)];
}

const ALL_TOKENS = allCommandTokens();

/** Resolve alias or exact name to canonical command name. */
export function resolveCommand(input: string): string | null {
  const lower = input.toLowerCase().trim();
  for (const c of COMMAND_META) {
    if (c.name === lower) return c.name;
    if (c.aliases.some((a) => a === lower)) return c.name;
  }
  return null;
}

// --- Levenshtein fuzzy matching -------------------------------------------------

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0)
  );
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
}

/** Max edit distance to consider a typo "close enough" to suggest. */
const FUZZY_THRESHOLD = 2;

/** Best canonical command name for a typo, or null. */
export function getDidYouMean(input: string): string | null {
  const lower = input.toLowerCase().trim();
  if (resolveCommand(lower)) return null; // already valid

  let best: string | null = null;
  let bestDist = FUZZY_THRESHOLD + 1;

  for (const c of COMMAND_META) {
    const dName = levenshtein(lower, c.name);
    if (dName <= FUZZY_THRESHOLD && dName < bestDist) {
      bestDist = dName;
      best = c.name;
    }
    for (const a of c.aliases) {
      const dAlias = levenshtein(lower, a);
      if (dAlias <= FUZZY_THRESHOLD && dAlias < bestDist) {
        bestDist = dAlias;
        best = c.name;
      }
    }
  }
  return best;
}

/** Fuzzy match for suggestions: return tokens within edit distance of prefix or of token start. */
function fuzzyMatchCandidates(prefix: string, maxDistance: number = 2): string[] {
  const lower = prefix.toLowerCase();
  const fuzzy: { token: string; dist: number }[] = [];

  for (const token of ALL_TOKENS) {
    const head = token.slice(0, lower.length);
    const dHead = head.length > 0 ? levenshtein(lower, head) : lower.length;
    const dFull = token.length > 0 ? levenshtein(lower, token) : lower.length;
    const d = Math.min(dHead, dFull);
    if (d <= maxDistance) fuzzy.push({ token, dist: d });
  }

  fuzzy.sort((a, b) => a.dist - b.dist);
  return [...new Set(fuzzy.map((f) => f.token))];
}

/** Map suggestion token to canonical name for display (prefer canonical in list). */
function tokenToCanonical(token: string): string {
  return resolveCommand(token) ?? token;
}

// --- Parser ---------------------------------------------------------------------

/** Parse input into cmd, args, and flags (e.g. --foo=bar or --flag). */
export function parseInput(input: string): ParsedInput {
  const trimmed = input.trim();
  const parts = trimmed.split(/\s+/).filter(Boolean);
  const args: string[] = [];
  const flags: Record<string, string | boolean> = {};

  for (const p of parts) {
    if (p.startsWith("--")) {
      const rest = p.slice(2);
      const eq = rest.indexOf("=");
      if (eq >= 0) {
        flags[rest.slice(0, eq)] = rest.slice(eq + 1);
      } else {
        flags[rest] = true;
      }
    } else {
      args.push(p);
    }
  }

  const rawCmd = (args.shift() ?? "").toLowerCase();
  const cmd = resolveCommand(rawCmd) ?? rawCmd; // normalize to canonical in parsed
  return { cmd, args, flags };
}

// --- Suggestions ----------------------------------------------------------------

/** Get autocomplete suggestions for the current token(s). Uses startsWith first, then fuzzy. */
export function getSuggestions(input: string): string[] {
  const trimmed = input.trim();
  const parts = trimmed.split(/\s+/);
  const last = parts[parts.length - 1] ?? "";
  const isNewToken = trimmed.endsWith(" ") || parts.length === 0;

  if (parts.length === 0 || (parts.length === 1 && !isNewToken)) {
    const prefix = last.toLowerCase();
    if (prefix.length === 0) return COMMAND_META.map((c) => c.name);
    const byPrefix = ALL_TOKENS.filter((t) => t.startsWith(prefix));
    if (byPrefix.length > 0) {
      return [...new Set(byPrefix.map(tokenToCanonical))];
    }
    const byFuzzy = fuzzyMatchCandidates(prefix);
    return [...new Set(byFuzzy.map(tokenToCanonical))];
  }

  const cmd = resolveCommand(parts[0].toLowerCase()) ?? parts[0].toLowerCase();

  if (cmd === "open" && (parts.length === 1 && isNewToken || parts.length === 2)) {
    const prefix = (parts[1] ?? "").toLowerCase();
    const slugs = getProjectSlugs();
    const routes = ["/", ROUTES.projects, ROUTES.lab, ROUTES.lifestyle, ROUTES.contact];
    const candidates = [
      ...routes.map((r) => (r === "/" ? "/" : r)),
      ...slugs,
    ].filter((s) => s.toLowerCase().startsWith(prefix || ""));
    return [...new Set(candidates)];
  }
  if (cmd === "quality" && (parts.length === 1 && isNewToken || parts.length === 2)) {
    const opts = ["auto", "high", "medium", "low"];
    const prefix = (parts[1] ?? "").toLowerCase();
    return opts.filter((o) => o.startsWith(prefix));
  }
  if (cmd === "perf" && (parts.length === 1 && isNewToken || parts.length === 2)) {
    const opts = ["on", "off"];
    const prefix = (parts[1] ?? "").toLowerCase();
    return opts.filter((o) => o.startsWith(prefix));
  }
  if (cmd === "explore" && (parts.length === 1 && isNewToken || parts.length === 2)) {
    const opts = ["guided", "free"];
    const prefix = (parts[1] ?? "").toLowerCase();
    return opts.filter((o) => o.startsWith(prefix));
  }
  if (cmd === "about" && (parts.length === 1 && isNewToken || parts.length === 2)) {
    const prefix = (parts[1] ?? "").toLowerCase();
    return ["tom"].filter((o) => o.startsWith(prefix));
  }
  if (cmd === "sudo" && (parts.length === 1 && isNewToken || parts.length === 2)) {
    const prefix = (parts[1] ?? "").toLowerCase();
    return ["dev-mode"].filter((m) => m.startsWith(prefix));
  }

  return [];
}

// --- Output helpers -------------------------------------------------------------

function text(content: string): CommandOutput {
  return { type: "text", content };
}
function link(content: string, href: string): CommandOutput {
  return { type: "link", content, href };
}
function hint(content: string): CommandOutput {
  return { type: "hint", content };
}

// --- Help by category ----------------------------------------------------------

const CATEGORY_LABELS: Record<CommandCategory, string> = {
  navigation: "Navigation",
  system: "System",
  information: "Information",
  actions: "Actions",
  secret: "Secret",
};

function buildHelpOutputs(): CommandOutput[] {
  const lines: CommandOutput[] = [
    text("TomOS — your control center for FocusedOnTom."),
    text(""),
  ];

  const byCategory = new Map<CommandCategory, CommandMeta[]>();
  for (const c of COMMAND_META) {
    const list = byCategory.get(c.category) ?? [];
    list.push(c);
    byCategory.set(c.category, list);
  }

  const order: CommandCategory[] = ["navigation", "information", "actions", "system", "secret"];
  for (const cat of order) {
    const list = byCategory.get(cat);
    if (!list?.length) continue;
    lines.push(text(`${CATEGORY_LABELS[cat]}:`));
    for (const c of list) {
      const names = [c.name, ...c.aliases].join(", ");
      lines.push(text(`  ${names} — ${c.description}`));
    }
    lines.push(text(""));
  }

  lines.push(hint(tom.helpHint()));
  return lines;
}

// --- Run ------------------------------------------------------------------------

/** Run a parsed command; returns outputs and optional route to navigate. */
export function runCommand(
  parsed: ParsedInput,
  context: TerminalContext
): RunResult {
  const { cmd, args } = parsed;
  const outputs: CommandOutput[] = [];

  if (!cmd) {
    return { outputs: [hint(tom.empty())] };
  }

  const isKnown = CANONICAL_NAMES.has(cmd);
  if (!isKnown) {
    const suggestion = getDidYouMean(cmd);
    if (suggestion) {
      outputs.push(hint(tom.didYouMean(suggestion)));
    } else {
      outputs.push(hint(tom.unknown(cmd)));
    }
    return { outputs };
  }

  switch (cmd) {
    case "help": {
      return { outputs: buildHelpOutputs() };
    }

    case "about": {
      const sub = (args[0] ?? "").toLowerCase();
      if (sub === "tom") {
        outputs.push(text(tom.aboutTom()));
        outputs.push(text(""));
        outputs.push(text(tom.aboutTomMore()));
      } else {
        outputs.push(hint(tom.tryAbout()));
      }
      return { outputs };
    }

    case "home": {
      outputs.push(text(tom.home()));
      outputs.push(link("FocusedOnTom", ROUTES.home));
      return { outputs, navigate: ROUTES.home };
    }

    case "projects": {
      const list = getProjects();
      outputs.push(text(tom.projects()));
      outputs.push(text(tom.projectsList()));
      outputs.push(link("View all →", ROUTES.projects));
      list.forEach((p) => {
        outputs.push(link(`  ${p.slug} — ${p.title}`, ROUTES.project(p.slug)));
      });
      return { outputs, navigate: ROUTES.projects };
    }

    case "skills": {
      const list = getSkills();
      outputs.push(text(tom.skills()));
      list.forEach((s) => {
        outputs.push(text(`  · ${s.label}${s.category ? ` (${s.category})` : ""}`));
      });
      return { outputs };
    }

    case "lab": {
      const list = getExperiments();
      outputs.push(text(tom.lab()));
      outputs.push(link("Open Lab →", ROUTES.lab));
      list.forEach((e) => outputs.push(text(`  · ${e.title} — ${e.description}`)));
      return { outputs, navigate: ROUTES.lab };
    }

    case "lifestyle": {
      outputs.push(text(tom.lifestyle()));
      outputs.push(link("Lifestyle →", ROUTES.lifestyle));
      return { outputs, navigate: ROUTES.lifestyle };
    }

    case "contact": {
      outputs.push(text(tom.contact()));
      outputs.push(link("Contact →", ROUTES.contact));
      return { outputs, navigate: ROUTES.contact };
    }

    case "open": {
      const target = args[0];
      if (!target) {
        outputs.push(hint(tom.openUsage()));
        return { outputs };
      }
      const path = target.startsWith("/") ? target : `/${target}`;
      const project = getProjectBySlug(target);
      if (project) {
        outputs.push(text(tom.openProject(project.title)));
        outputs.push(link(project.title, ROUTES.project(project.slug)));
        return { outputs, navigate: ROUTES.project(project.slug) };
      }
      const known: string[] = [ROUTES.home, ROUTES.projects, ROUTES.lab, ROUTES.lifestyle, ROUTES.contact];
      const normalized = path === "" ? "/" : path;
      if (known.includes(normalized) || known.some((r) => normalized.startsWith(r + "/"))) {
        outputs.push(text(tom.openRoute(normalized)));
        outputs.push(link(normalized, normalized));
        return { outputs, navigate: normalized };
      }
      outputs.push(link(`Opening ${path}`, path));
      return { outputs, navigate: path };
    }

    case "explain": {
      const topic = args.join(" ").trim() || "this terminal";
      const replies = tom.explain(topic);
      const i = Math.abs(topic.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % replies.length;
      outputs.push(text(replies[i]));
      return { outputs };
    }

    case "quality": {
      const mode = (args[0] ?? "").toLowerCase();
      const valid = ["auto", "high", "medium", "low"];
      if (!valid.includes(mode)) {
        outputs.push(hint(tom.usageQuality()));
        return { outputs };
      }
      context.setQualityMode(mode as "auto" | "high" | "medium" | "low");
      outputs.push(text(tom.qualitySet(mode)));
      outputs.push(text(mode === "auto" ? tom.qualityAuto() : tom.qualityOther()));
      return { outputs };
    }

    case "perf": {
      const v = (args[0] ?? "").toLowerCase();
      if (v === "on") {
        context.setPerfOn();
        outputs.push(text(tom.perfOn()));
        outputs.push(text(tom.perfOnSaved()));
      } else if (v === "off") {
        context.setPerfOff();
        const restored = context.getQualityMode();
        outputs.push(text(tom.perfOff()));
        outputs.push(text(tom.perfRestored(restored)));
      } else {
        outputs.push(hint(tom.usagePerf()));
      }
      return { outputs };
    }

    case "explore": {
      const mode = (args[0] ?? "").toLowerCase();
      if (mode === "guided" || mode === "free") {
        context.setExploreMode(mode);
        if (mode === "guided") {
          outputs.push(text(tom.exploreGuided()));
          outputs.push(text(tom.exploreGuidedDesc()));
        } else {
          outputs.push(text(tom.exploreFree()));
          outputs.push(text(tom.exploreFreeDesc()));
        }
      } else {
        outputs.push(hint(tom.usageExplore()));
      }
      return { outputs };
    }

    case "sudo": {
      const sub = (args[0] ?? "").toLowerCase();
      if (sub === "dev-mode") {
        const next = !context.getDevMode();
        context.setDevMode(next);
        outputs.push(text(next ? tom.devModeOn() : tom.devModeOff()));
      } else {
        outputs.push(hint(tom.usageSudo()));
      }
      return { outputs };
    }

    default:
      outputs.push(hint(tom.unknown(cmd)));
      return { outputs };
  }
}
