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
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/store/appStore";
import { CommandSuggestions } from "./CommandSuggestions";
import { cn } from "@/lib/cn";
import {
  parseInput,
  getSuggestions,
  runCommand,
} from "@/lib/terminal/commands";
import { loadHistory, saveHistory } from "@/lib/terminal/history";
import type { CommandOutput } from "@/lib/terminal/types";

const PROMPT = ">";
const MAX_SUGGESTIONS = 8;

const PANEL_EASING = [0.32, 0.72, 0, 1];
const PANEL_DURATION = 0.35;
const OUTPUT_STAGGER = 0.04;

interface HistoryEntry {
  input: string;
  outputs: CommandOutput[];
}

export function TerminalPanel() {
  const terminalOpen = useAppStore((s) => s.terminalOpen);
  const setTerminalOpen = useAppStore((s) => s.setTerminalOpen);
  const setQualityMode = useAppStore((s) => s.setQualityMode);
  const setPerfOn = useAppStore((s) => s.setPerfOn);
  const setPerfOff = useAppStore((s) => s.setPerfOff);
  const setExploreMode = useAppStore((s) => s.setExploreMode);
  const setDevMode = useAppStore((s) => s.setDevMode);

  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const panelContentRef = useRef<HTMLDivElement>(null);
  const inputWrapperRef = useRef<HTMLDivElement>(null);

  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    const persisted = loadHistory();
    return persisted.map((input) => ({ input, outputs: [] }));
  });
  const [currentInput, setCurrentInput] = useState("");
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [focused, setFocused] = useState(false);
  const [suggestionsSuppressed, setSuggestionsSuppressed] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const persistedInputsRef = useRef<string[]>(loadHistory());

  const listId = useId();
  const getOptionId = (i: number) => `${listId}-option-${i}`;

  const context = {
    setQualityMode,
    setPerfOn,
    setPerfOff,
    setExploreMode,
    setDevMode,
    getDevMode: () => useAppStore.getState().devMode,
    getQualityMode: () => useAppStore.getState().qualityMode,
  };

  const suggestions = getSuggestions(currentInput);
  const query = currentInput.trim();
  const hasQuery = query.length > 0;
  const displayItems = suggestions.slice(0, MAX_SUGGESTIONS);
  const suggestionsOpen =
    focused && hasQuery && displayItems.length > 0 && !suggestionsSuppressed;

  useEffect(() => {
    if (terminalOpen) {
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [terminalOpen]);

  useEffect(() => {
    setActiveIndex(0);
  }, [currentInput]);

  useEffect(() => {
    if (!suggestionsOpen) return;
    setActiveIndex((prev) =>
      Math.min(prev, Math.max(0, displayItems.length - 1))
    );
  }, [suggestionsOpen, displayItems.length]);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      const el = panelContentRef.current;
      if (!el || el.contains(e.target as Node)) return;
      setSuggestionsSuppressed(true);
    };
    window.addEventListener("mousedown", handleMouseDown, true);
    return () => window.removeEventListener("mousedown", handleMouseDown, true);
  }, []);

  const scrollToBottom = useCallback(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [history, currentInput, scrollToBottom]);

  const applySuggestion = useCallback((chosen: string) => {
    setCurrentInput((prev) => {
      const trimmed = prev.trim();
      const parts = trimmed.split(/\s+/).filter(Boolean);
      if (parts.length <= 1) return chosen + " ";
      const rest = parts.slice(0, -1).join(" ") + " ";
      return rest + chosen;
    });
    setSuggestionsSuppressed(true);
    setActiveIndex(0);
    inputRef.current?.focus();
  }, []);

  const run = useCallback(() => {
    const raw = currentInput.trim();
    if (!raw) return;

    const parsed = parseInput(raw);
    const { outputs, navigate } = runCommand(parsed, context);

    setHistory((prev) => [...prev, { input: raw, outputs }]);
    persistedInputsRef.current = [...persistedInputsRef.current, raw];
    saveHistory(persistedInputsRef.current);
    setCurrentInput("");
    setHistoryIndex(-1);
    setSuggestionsSuppressed(true);
    setActiveIndex(0);

    if (navigate) {
      router.push(navigate);
    }
    requestAnimationFrame(() => {
      requestAnimationFrame(scrollToBottom);
    });
  }, [currentInput, router, scrollToBottom]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      setSuggestionsSuppressed(true);
      setActiveIndex(0);
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      if (suggestionsOpen && displayItems.length > 0) {
        const idx = Math.min(activeIndex, displayItems.length - 1);
        applySuggestion(displayItems[idx]);
        return;
      }
      run();
      return;
    }

    if (e.key === "Tab") {
      e.preventDefault();
      if (suggestionsOpen && displayItems.length > 0) {
        const idx = Math.min(activeIndex, displayItems.length - 1);
        applySuggestion(displayItems[idx]);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (suggestionsOpen && displayItems.length > 0) {
        setActiveIndex((prev) =>
          prev < displayItems.length - 1 ? prev + 1 : 0
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
      if (suggestionsOpen && displayItems.length > 0) {
        setActiveIndex((prev) =>
          prev > 0 ? prev - 1 : displayItems.length - 1
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
  };

  const handleInputChange = useCallback((value: string) => {
    setCurrentInput(value);
    setSuggestionsSuppressed(false);
  }, []);

  return (
    <AnimatePresence>
      {terminalOpen && (
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 28 }}
          transition={{
            duration: PANEL_DURATION,
            ease: PANEL_EASING,
          }}
          className={cn(
            "fixed bottom-20 left-4 right-4 z-40 flex max-h-[min(70vh,420px)] min-h-[200px] flex-col",
            "md:left-auto md:right-6 md:max-w-xl md:bottom-24",
            "rounded-[var(--radius-panel)] border border-border backdrop-blur-[var(--blur)]",
            "isolate"
          )}
          style={{
            background: "var(--panel)",
            boxShadow: "var(--shadow-panel, 0 25px 50px -12px rgba(0,0,0,0.25))",
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Terminal"
        >
          {/* Very faint scanline overlay */}
          <div
            className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-[0.4]"
            aria-hidden
            style={{
              backgroundImage: `repeating-linear-gradient(
                0deg,
                transparent 0px,
                transparent 2px,
                rgba(0,0,0,0.04) 2px,
                rgba(0,0,0,0.04) 4px
              )`,
            }}
          />

          <div
            ref={panelContentRef}
            className="relative flex min-h-0 flex-1 flex-col"
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
              className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-2 font-mono text-sm scroll-smooth"
              style={{ scrollBehavior: "smooth" }}
            >
              {history.length === 0 && (
                <p className="mb-2 text-textMuted">
                  Type <kbd className="rounded border border-border px-1">help</kbd> for
                  commands. ↑/↓ history, Tab autocomplete.
                </p>
              )}
              {history.map((entry, i) => (
                <HistoryEntryBlock
                  key={i}
                  entry={entry}
                  router={router}
                />
              ))}

              <div className="flex items-center gap-2">
                <span className="shrink-0 text-mint" aria-hidden>
                  {PROMPT}
                </span>
                <div
                  ref={inputWrapperRef}
                  className={cn(
                    "relative min-w-0 flex-1 rounded transition-shadow duration-300",
                    focused && "terminal-input-glow"
                  )}
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={currentInput}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    className={cn(
                      "w-full min-w-0 rounded border-none bg-transparent font-mono text-sm text-text outline-none",
                      "placeholder:text-textMuted"
                    )}
                    placeholder="Type a command..."
                    aria-label="Terminal input"
                    aria-autocomplete="list"
                    aria-controls={suggestionsOpen ? listId : undefined}
                    aria-activedescendant={
                      suggestionsOpen ? getOptionId(Math.min(activeIndex, displayItems.length - 1)) : undefined
                    }
                    autoComplete="off"
                    autoCapitalize="off"
                    spellCheck={false}
                  />
                  <CommandSuggestions
                    open={suggestionsOpen}
                    query={query}
                    items={displayItems}
                    selectedIndex={activeIndex}
                    listId={listId}
                    getOptionId={getOptionId}
                    onSelect={applySuggestion}
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function HistoryEntryBlock({
  entry,
  router,
}: {
  entry: HistoryEntry;
  router: ReturnType<typeof useRouter>;
}) {
  return (
    <div className="mb-3">
      <div className="flex items-baseline gap-2">
        <span className="shrink-0 text-mint" aria-hidden>
          {PROMPT}
        </span>
        <span className="text-text">{entry.input}</span>
      </div>
      {entry.outputs.length > 0 && (
        <motion.div
          className="ml-3 mt-1 space-y-0.5"
          initial="hidden"
          animate="visible"
          variants={{
            visible: {
              transition: { staggerChildren: OUTPUT_STAGGER, delayChildren: 0.02 },
            },
            hidden: {},
          }}
        >
          {entry.outputs.map((out, j) => (
            <motion.div
              key={j}
              variants={{
                hidden: { opacity: 0, y: 6 },
                visible: { opacity: 1, y: 0 },
              }}
              transition={{
                duration: 0.2,
                ease: PANEL_EASING,
              }}
            >
              <OutputLine output={out} router={router} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
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
