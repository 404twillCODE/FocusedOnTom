"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FOYInput, FOYButton } from "@/app/focusedonyou/_components";

type Props = {
  open: boolean;
  onClose: () => void;
  templateExercises: { name: string }[];
  existingNames: Set<string>;
  onSelectExercise: (name: string) => void;
};

export function AddExerciseSheet({
  open,
  onClose,
  templateExercises,
  existingNames,
  onSelectExercise,
}: Props) {
  const [customName, setCustomName] = useState("");

  if (!open) return null;

  function handleSelect(name: string) {
    onSelectExercise(name.trim());
    setCustomName("");
    onClose();
  }

  const availableFromTemplate = templateExercises.filter(
    (e) => !existingNames.has(e.name)
  );

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
        aria-hidden
      />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="fixed bottom-0 left-0 right-0 z-50 max-h-[70vh] overflow-auto rounded-t-2xl border-t border-[var(--border)] bg-[var(--bg2)] p-4 pb-safe"
      >
        <p className="mb-3 text-sm font-medium text-[var(--text)]">Add exercise</p>
        {availableFromTemplate.length > 0 && (
          <div className="mb-4">
            <p className="mb-2 text-xs text-[var(--textMuted)]">From workout</p>
            <ul className="flex flex-col gap-2">
              {availableFromTemplate.map((e) => (
                <li key={e.name}>
                  <button
                    type="button"
                    onClick={() => handleSelect(e.name)}
                    className="flex min-h-[48px] w-full items-center rounded-xl border border-[var(--border)] bg-[var(--bg3)]/50 px-4 text-left text-[var(--text)] transition-colors duration-200 hover:border-[var(--ice)]/30 focus-visible:outline focus-visible:ring-2 focus-visible:ring-[var(--ice)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg2)]"
                  >
                    {e.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div>
          <p className="mb-2 text-xs text-[var(--textMuted)]">Custom name</p>
          <div className="flex gap-2">
            <FOYInput
              type="text"
              placeholder="e.g. Plank"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="flex-1"
              autoFocus
            />
            <FOYButton
              type="button"
              variant="primary"
              onClick={() => customName.trim() && handleSelect(customName)}
              disabled={!customName.trim()}
              className="min-w-[80px]"
            >
              Add
            </FOYButton>
          </div>
        </div>
      </motion.div>
    </>
  );
}
