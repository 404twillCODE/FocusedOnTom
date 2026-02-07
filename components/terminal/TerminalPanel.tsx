"use client";

import {
  useRef,
  useState,
  useEffect,
  useCallback,
  KeyboardEvent,
  useId,
} from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { useAppStore } from "@/store/appStore";
import { GlassPanel } from "@/components/shell/GlassPanel";
import { cn } from "@/lib/cn";
import {
  parseInput,
  getSuggestions,
  runCommand,
} from "@/lib/terminal/commands";
import type { CommandOutput } from "@/lib/terminal/types";

const PROMPT = ">";

interface HistoryEntry {
  input: string;
  outputs: CommandOutput[];
}

export function TerminalPanel() {
  const terminalOpen = useAppStore((s) => s.terminalOpen);
  const setTerminalOpen = useAppStore((s) => s.setTerminalOpen);
  const setQualityMode = useAppStore((s) => s.setQualityMode);
  const setExploreMode = useAppStore((s) => s.setExploreMode);
  const setDevMode = useAppStore((s) => s.setDevMode);

  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [suggestions, setSuggestionsState] = useState<string[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);

  const listId = useId();
  const listOptionId = (i: number) => `${listId}-option-${i}`;

  const context = {
    setQualityMode,
    setExploreMode,
    setDevMode,
    getDevMode: () => useAppStore.getState().devMode,
  };

  useEffect(() => {
    if (terminalOpen) {
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [terminalOpen]);

  useEffect(() => {
    const next = getSuggestions(currentInput);
    setSuggestionsState(next);
    setSelectedSuggestionIndex(0);
  }, [currentInput]);

  const scrollToBottom = useCallback(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [history, currentInput, scrollToBottom]);

  const run = useCallback(() => {
    const raw = currentInput.trim();
    if (!raw) return;

    const parsed = parseInput(raw);
    const { outputs, navigate } = runCommand(parsed, context);

    setHistory((prev) => [...prev, { input: raw, outputs }]);
    setCurrentInput("");
    setHistoryIndex(-1);
    setSuggestionsState([]);

    if (navigate) {
      router.push(navigate);
    }
    scrollToBottom();
  }, [currentInput, router, scrollToBottom]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (suggestions.length > 0) {
        const chosen = suggestions[selectedSuggestionIndex];
        const trimmed = currentInput.trim();
        const parts = trimmed.split(/\s+/).filter(Boolean);
        if (parts.length <= 1) {
          setCurrentInput(chosen + " ");
        } else {
          const rest = parts.slice(0, -1).join(" ") + " ";
          setCurrentInput(rest + chosen);
        }
        setSuggestionsState([]);
        return;
      }
      run();
      return;
    }

    if (e.key === "Tab") {
      e.preventDefault();
      if (suggestions.length > 0) {
        const chosen = suggestions[selectedSuggestionIndex];
        const trimmed = currentInput.trim();
        const parts = trimmed.split(/\s+/).filter(Boolean);
        if (parts.length === 0) {
          setCurrentInput(chosen + " ");
        } else if (parts.length === 1) {
          setCurrentInput(chosen + " ");
        } else {
          const rest = parts.slice(0, -1).join(" ") + " ";
          setCurrentInput(rest + chosen);
        }
        setSuggestionsState([]);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (suggestions.length > 0) {
        setSelectedSuggestionIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        return;
      }
      if (historyIndex >= 0 && historyIndex < history.length - 1) {
        const next = historyIndex + 1;
        setHistoryIndex(next);
        setCurrentInput(history[next].input);
      } else if (historyIndex === history.length - 1) {
        setHistoryIndex(-1);
        setCurrentInput("");
      }
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (suggestions.length > 0) {
        setSelectedSuggestionIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        return;
      }
      if (history.length === 0) return;
      const next =
        historyIndex <= 0 ? history.length - 1 : historyIndex - 1;
      setHistoryIndex(next);
      setCurrentInput(history[next].input);
      return;
    }

    if (e.key === "Escape") {
      setSuggestionsState([]);
      setSelectedSuggestionIndex(0);
      inputRef.current?.blur();
    }
  };

  const handleSuggestionKeyDown = (e: KeyboardEvent, index: number) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const chosen = suggestions[index];
      const trimmed = currentInput.trim();
      const parts = trimmed.split(/\s+/).filter(Boolean);
      if (parts.length <= 1) {
        setCurrentInput(chosen + " ");
      } else {
        const rest = parts.slice(0, -1).join(" ") + " ";
        setCurrentInput(rest + chosen);
      }
      setSuggestionsState([]);
      setSelectedSuggestionIndex(0);
      inputRef.current?.focus();
    }
  };

  if (!terminalOpen) return null;

  return (
    <GlassPanel
      variant="panel"
      glow="none"
      className={cn(
        "fixed bottom-20 left-4 right-4 z-40 flex max-h-[min(70vh,420px)] min-h-[200px] flex-col",
        "md:left-auto md:right-6 md:max-w-xl md:bottom-24",
        "border border-border backdrop-blur-[var(--blur)]"
      )}
      role="dialog"
      aria-modal="true"
      aria-label="Terminal"
    >
      <div className="flex shrink-0 items-center justify-between border-b border-border px-3 py-2">
        <span className="font-mono text-xs font-medium text-textMuted">
          TomOS
        </span>
        <div className="flex items-center gap-2">
          <span className="hidden text-[10px] text-textMuted sm:inline">FocusedOnTom</span>
          <button
            type="button"
            onClick={() => setTerminalOpen(false)}
            className="rounded p-1 text-textMuted hover:bg-panel hover:text-text focus:outline-none focus-visible:ring-2 focus-visible:ring-mint focus-visible:ring-offset-1 focus-visible:ring-offset-bg"
            aria-label="Close terminal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-2 font-mono text-sm"
      >
        {history.length === 0 && (
          <p className="mb-2 text-textMuted">
            Type <kbd className="rounded border border-border px-1">help</kbd> for
            commands. ↑/↓ history, Tab autocomplete.
          </p>
        )}
        {history.map((entry, i) => (
          <div key={i} className="mb-3">
            <div className="flex items-baseline gap-2">
              <span className="shrink-0 text-mint" aria-hidden>
                {PROMPT}
              </span>
              <span className="text-text">{entry.input}</span>
            </div>
            <div className="ml-3 mt-1 space-y-0.5">
              {entry.outputs.map((out, j) => (
                <OutputLine key={j} output={out} router={router} />
              ))}
            </div>
          </div>
        ))}

        <div className="flex items-center gap-2">
          <span className="shrink-0 text-mint" aria-hidden>
            {PROMPT}
          </span>
          <div className="relative min-w-0 flex-1">
            <input
              ref={inputRef}
              type="text"
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className={cn(
                "w-full min-w-0 border-none bg-transparent font-mono text-sm text-text outline-none",
                "placeholder:text-textMuted"
              )}
              placeholder="Type a command..."
              aria-label="Terminal input"
              aria-autocomplete="list"
              aria-controls={suggestions.length ? listId : undefined}
              aria-activedescendant={
                suggestions.length
                  ? listOptionId(selectedSuggestionIndex)
                  : undefined
              }
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
            />
            {suggestions.length > 0 && (
              <ul
                id={listId}
                role="listbox"
                className="absolute bottom-full left-0 right-0 z-10 mb-1 max-h-40 overflow-auto rounded-md border border-border bg-panel-solid py-1 shadow-lg"
              >
                {suggestions.map((s, i) => (
                  <li
                    key={s}
                    id={listOptionId(i)}
                    role="option"
                    aria-selected={i === selectedSuggestionIndex}
                    className={cn(
                      "cursor-pointer px-3 py-1.5 font-mono text-sm",
                      i === selectedSuggestionIndex
                        ? "bg-mint/20 text-mint"
                        : "text-text hover:bg-panel"
                    )}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      const trimmed = currentInput.trim();
                      const parts = trimmed.split(/\s+/).filter(Boolean);
                      if (parts.length <= 1) {
                        setCurrentInput(s + " ");
                      } else {
                        const rest = parts.slice(0, -1).join(" ") + " ";
                        setCurrentInput(rest + s);
                      }
                      setSuggestionsState([]);
                      inputRef.current?.focus();
                    }}
                    onKeyDown={(e) => handleSuggestionKeyDown(e, i)}
                  >
                    {s}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </GlassPanel>
  );
}

function OutputLine({
  output,
  router,
}: {
  output: CommandOutput;
  router: ReturnType<typeof useRouter>;
}) {
  if (output.type === "text") {
    return <p className="text-textMuted">{output.content}</p>;
  }
  if (output.type === "link") {
    return (
      <button
        type="button"
        className="text-left text-mint underline decoration-mint/60 underline-offset-2 hover:decoration-mint focus:outline-none focus-visible:ring-2 focus-visible:ring-mint focus-visible:ring-offset-1 focus-visible:ring-offset-bg rounded px-0.5"
        onClick={() => router.push(output.href)}
      >
        {output.content}
      </button>
    );
  }
  return (
    <p className="text-xs text-textMuted/90 italic">{output.content}</p>
  );
}
