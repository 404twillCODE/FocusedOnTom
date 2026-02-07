export type CommandOutputType = "text" | "link" | "hint";

export interface CommandOutputText {
  type: "text";
  content: string;
}

export interface CommandOutputLink {
  type: "link";
  content: string;
  href: string;
}

export interface CommandOutputHint {
  type: "hint";
  content: string;
}

export type CommandOutput =
  | CommandOutputText
  | CommandOutputLink
  | CommandOutputHint;

export interface ParsedInput {
  cmd: string;
  args: string[];
  flags: Record<string, string | boolean>;
}

export interface RunResult {
  outputs: CommandOutput[];
  navigate?: string;
}

export interface TerminalContext {
  setQualityMode: (mode: "auto" | "high" | "medium" | "low") => void;
  setPerfOn: () => void;
  setPerfOff: () => void;
  setExploreMode: (mode: "guided" | "free") => void;
  setDevMode: (value: boolean) => void;
  getDevMode: () => boolean;
  getQualityMode: () => string;
}
