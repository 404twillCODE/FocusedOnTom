/**
 * Shown at the bottom of all routes under /photography.
 * Keep copy short and in your voice; edit the text if you want it stricter or friendlier.
 */
export function PhotographyUsageNotice() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--bg2)]/25">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <p className="text-xs leading-relaxed text-[var(--textMuted)] sm:text-sm">
          <span className="font-medium text-[var(--text)]">Usage & rights.</span>{" "}
          The photography on this site is my work. Please don&apos;t sell, license, or
          use these images for commercial purposes without my permission. If you want to
          share something non-commercially, credit and a link back are appreciated—
          get in touch if you&apos;re unsure.
        </p>
      </div>
    </footer>
  );
}
