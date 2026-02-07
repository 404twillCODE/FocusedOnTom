"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { env } from "@/lib/env";
import { cn } from "@/lib/cn";

const PREVIEW_COOKIE = "fot_preview";
const BANNER_HEIGHT = 40;

function getPreviewCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie
    .split("; ")
    .some((row) => row.startsWith(`${PREVIEW_COOKIE}=1`));
}

function clearPreviewCookie() {
  document.cookie = `${PREVIEW_COOKIE}=; path=/; max-age=0`;
}

export function usePreviewBanner() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (env.public.siteMode !== "development") {
      setShow(false);
      return;
    }
    setShow(getPreviewCookie());
  }, []);
  return { show, bannerHeight: BANNER_HEIGHT };
}

interface PreviewBannerProps {
  show: boolean;
}

export function PreviewBanner({ show }: PreviewBannerProps) {
  const router = useRouter();

  const handleExit = () => {
    clearPreviewCookie();
    router.push("/holding");
  };

  if (!show) return null;

  return (
    <div
      className={cn(
        "fixed left-0 right-0 top-0 z-50 flex items-center justify-between gap-4 border-b border-border bg-panel-solid/95 px-4 py-2 backdrop-blur-[var(--blur)]"
      )}
      style={{ height: BANNER_HEIGHT }}
      role="banner"
      aria-label="Preview mode"
    >
      <span className="font-mono text-xs text-textMuted sm:text-sm">
        Preview Mode (Site In Development)
      </span>
      <button
        type="button"
        onClick={handleExit}
        className={cn(
          "rounded px-3 py-1.5 font-mono text-xs text-mint",
          "hover:bg-mint/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-mint focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        )}
      >
        Exit
      </button>
    </div>
  );
}
