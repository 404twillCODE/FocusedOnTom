"use client";

import { useEffect } from "react";

function isInProtectedZone(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest('[data-photo-protect-root="true"]'));
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;
  if (target instanceof HTMLInputElement) return true;
  if (target instanceof HTMLTextAreaElement) return true;
  if (target instanceof HTMLElement) return target.isContentEditable;
  return false;
}

export function PhotoProtectionGuards() {
  useEffect(() => {
    function onContextMenu(event: MouseEvent) {
      if (!isInProtectedZone(event.target)) return;
      event.preventDefault();
    }

    function onDragStart(event: DragEvent) {
      if (!isInProtectedZone(event.target)) return;
      event.preventDefault();
    }

    function onCopy(event: ClipboardEvent) {
      if (!isInProtectedZone(event.target)) return;
      event.preventDefault();
    }

    function onKeyDown(event: KeyboardEvent) {
      if (!isInProtectedZone(event.target)) return;
      if (isEditableTarget(event.target)) return;
      const key = event.key.toLowerCase();
      const hasCommand = event.metaKey || event.ctrlKey;
      if (hasCommand && (key === "c" || key === "s")) {
        event.preventDefault();
      }
    }

    document.addEventListener("contextmenu", onContextMenu, true);
    document.addEventListener("dragstart", onDragStart, true);
    document.addEventListener("copy", onCopy, true);
    document.addEventListener("keydown", onKeyDown, true);

    return () => {
      document.removeEventListener("contextmenu", onContextMenu, true);
      document.removeEventListener("dragstart", onDragStart, true);
      document.removeEventListener("copy", onCopy, true);
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, []);

  return null;
}
