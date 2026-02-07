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

const COMMANDS = [
  "help",
  "projects",
  "skills",
  "lab",
  "lifestyle",
  "contact",
  "open",
  "explain",
  "quality",
  "perf",
  "explore",
  "sudo",
] as const;

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

  const cmd = (args.shift() ?? "").toLowerCase();
  return { cmd, args, flags };
}

/** Get autocomplete suggestions for the current token(s). */
export function getSuggestions(input: string): string[] {
  const trimmed = input.trim();
  const parts = trimmed.split(/\s+/);
  const last = parts[parts.length - 1] ?? "";
  const isNewToken = trimmed.endsWith(" ") || parts.length === 0;

  if (parts.length === 0 || (parts.length === 1 && !isNewToken)) {
    const prefix = last.toLowerCase();
    return COMMANDS.filter((c) => c.startsWith(prefix));
  }

  const cmd = parts[0].toLowerCase();
  if (cmd === "open" && (parts.length === 1 && isNewToken || parts.length === 2)) {
    const prefix = (parts[1] ?? "").toLowerCase();
    const routes = [ROUTES.home, ROUTES.projects, ROUTES.lab, ROUTES.lifestyle, ROUTES.contact];
    const slugs = getProjectSlugs();
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
  if (cmd === "sudo" && (parts.length === 1 && isNewToken || parts.length === 2)) {
    const prefix = (parts[1] ?? "").toLowerCase();
    return ["dev-mode"].filter((m) => m.startsWith(prefix));
  }

  return [];
}

function text(content: string): CommandOutput {
  return { type: "text", content };
}
function link(content: string, href: string): CommandOutput {
  return { type: "link", content, href };
}
function hint(content: string): CommandOutput {
  return { type: "hint", content };
}

/** Run a parsed command; returns outputs and optional route to navigate. */
export function runCommand(
  parsed: ParsedInput,
  context: TerminalContext
): RunResult {
  const { cmd, args } = parsed;
  const outputs: CommandOutput[] = [];

  if (!cmd) {
    return { outputs: [hint("Type a command. Try help.")] };
  }

  switch (cmd) {
    case "help": {
      outputs.push(text("TomOS — FocusedOnTom terminal"));
      outputs.push(text(""));
      outputs.push(text("Navigation & info:"));
      outputs.push(link("  projects", ROUTES.projects));
      outputs.push(link("  lab", ROUTES.lab));
      outputs.push(link("  lifestyle", ROUTES.lifestyle));
      outputs.push(link("  contact", ROUTES.contact));
      outputs.push(text("  skills — list skills"));
      outputs.push(text(""));
      outputs.push(text("Actions:"));
      outputs.push(text("  open <route|slug> — go to route or project"));
      outputs.push(text("  explain <topic> — ask AI Tom about something"));
      outputs.push(text("  quality <auto|high|medium|low> — set visual quality"));
      outputs.push(text("  perf <on|off> — performance mode"));
      outputs.push(text("  explore <guided|free> — navigation mode"));
      outputs.push(text(""));
      outputs.push(hint("Use Tab to autocomplete, ↑/↓ for history."));
      return { outputs };
    }

    case "projects": {
      const list = getProjects();
      outputs.push(link("Projects", ROUTES.projects));
      list.forEach((p) => {
        outputs.push(link(`  ${p.slug} — ${p.title}`, ROUTES.project(p.slug)));
      });
      return { outputs, navigate: ROUTES.projects };
    }

    case "skills": {
      const list = getSkills();
      outputs.push(text("Skills"));
      list.forEach((s) => {
        outputs.push(text(`  ${s.label}${s.category ? ` (${s.category})` : ""}`));
      });
      return { outputs };
    }

    case "lab": {
      const list = getExperiments();
      outputs.push(link("Lab", ROUTES.lab));
      list.forEach((e) => outputs.push(text(`  ${e.title} — ${e.description}`)));
      return { outputs, navigate: ROUTES.lab };
    }

    case "lifestyle":
      outputs.push(link("Lifestyle", ROUTES.lifestyle));
      return { outputs, navigate: ROUTES.lifestyle };

    case "contact":
      outputs.push(link("Contact", ROUTES.contact));
      return { outputs, navigate: ROUTES.contact };

    case "open": {
      const target = args[0];
      if (!target) {
        outputs.push(hint("Usage: open <route|project-slug>. Examples: open /, open /projects, open example"));
        return { outputs };
      }
      const path = target.startsWith("/") ? target : `/${target}`;
      const project = getProjectBySlug(target);
      if (project) {
        outputs.push(link(`Opening project: ${project.title}`, ROUTES.project(project.slug)));
        return { outputs, navigate: ROUTES.project(project.slug) };
      }
      const known: string[] = [ROUTES.home, ROUTES.projects, ROUTES.lab, ROUTES.lifestyle, ROUTES.contact];
      const normalized = path === "" ? "/" : path;
      if (known.includes(normalized) || known.some((r) => normalized.startsWith(r + "/"))) {
        outputs.push(link(`Opening ${normalized}`, normalized));
        return { outputs, navigate: normalized };
      }
      outputs.push(link(`Opening ${path}`, path));
      return { outputs, navigate: path };
    }

    case "explain": {
      const topic = args.join(" ").trim() || "this terminal";
      const replies: string[] = [
        `"${topic}" — here's what I know: it's part of the FocusedOnTom experience. More depth coming soon.`,
        `AI Tom says: "${topic}" is a great question. I'm a rule-based buddy for now; check back later for smarter answers.`,
        `Re: ${topic} — keeping it minimal. Use the nav commands to explore the site.`,
      ];
      const i = Math.abs(topic.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % replies.length;
      outputs.push(text(replies[i]));
      return { outputs };
    }

    case "quality": {
      const mode = (args[0] ?? "").toLowerCase();
      const valid = ["auto", "high", "medium", "low"];
      if (!valid.includes(mode)) {
        outputs.push(hint("Usage: quality <auto|high|medium|low>"));
        return { outputs };
      }
      context.setQualityMode(mode as "auto" | "high" | "medium" | "low");
      outputs.push(text(`Quality set to ${mode}.`));
      return { outputs };
    }

    case "perf": {
      const v = (args[0] ?? "").toLowerCase();
      if (v === "on") {
        context.setQualityMode("high");
        outputs.push(text("Performance mode: on (high quality)."));
      } else if (v === "off") {
        context.setQualityMode("low");
        outputs.push(text("Performance mode: off (low quality)."));
      } else {
        outputs.push(hint("Usage: perf <on|off>"));
      }
      return { outputs };
    }

    case "explore": {
      const mode = (args[0] ?? "").toLowerCase();
      if (mode === "guided" || mode === "free") {
        context.setExploreMode(mode);
        outputs.push(text(`Explore mode: ${mode}.`));
      } else {
        outputs.push(hint("Usage: explore <guided|free>"));
      }
      return { outputs };
    }

    case "sudo": {
      const sub = (args[0] ?? "").toLowerCase();
      if (sub === "dev-mode") {
        const next = !context.getDevMode();
        context.setDevMode(next);
        outputs.push(
          text(
            next
              ? "🔓 Dev mode unlocked. You're in the loop. (No dangerous actions — just good vibes.)"
              : "🔒 Dev mode off."
          )
        );
      } else {
        outputs.push(hint("Unknown sudo command. Try: sudo dev-mode"));
      }
      return { outputs };
    }

    default:
      outputs.push(hint(`Unknown command: ${cmd}. Type help for commands.`));
      return { outputs };
  }
}
