"use client";

import { useEffect, useRef } from "react";

type Props = {
  children: React.ReactNode;
  className?: string;
};

export function PhotoInteractionShield({ children, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function isInsideShield(target: EventTarget | null) {
      if (!containerRef.current) return false;
      if (!(target instanceof Node)) return false;
      return containerRef.current.contains(target);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (!isInsideShield(event.target)) return;
      const key = event.key.toLowerCase();
      const hasCommand = event.metaKey || event.ctrlKey;
      const blockedWithCommand = key === "c" || key === "s";
      if (hasCommand && blockedWithCommand) {
        event.preventDefault();
      }
    }

    function onCopy(event: ClipboardEvent) {
      if (!isInsideShield(event.target)) return;
      event.preventDefault();
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("copy", onCopy);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("copy", onCopy);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      data-photo-protect-root="true"
      className={className}
      onContextMenu={(event) => event.preventDefault()}
      onDragStart={(event) => event.preventDefault()}
      onCopy={(event) => event.preventDefault()}
    >
      {children}
    </div>
  );
}
