export default function FocusedOnYouAppLoading() {
  return (
    <div
      className="mx-auto w-full max-w-[min(100%,theme(maxWidth.5xl))] px-4 py-8 sm:px-6"
      aria-hidden
    >
      <div className="flex items-center justify-between gap-4">
        <div className="h-6 w-32 animate-pulse rounded-lg bg-[var(--bg3)]" />
        <div className="h-12 w-28 animate-pulse rounded-xl bg-[var(--bg3)]" />
      </div>
      <ul className="mt-6 flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <li key={i} className="rounded-2xl border border-[var(--border)] bg-[var(--bg2)]/50 p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <div className="h-5 w-40 animate-pulse rounded-lg bg-[var(--bg3)]" />
                <div className="h-4 w-24 animate-pulse rounded-lg bg-[var(--bg3)]" />
              </div>
              <div className="h-12 w-28 animate-pulse rounded-xl bg-[var(--bg3)]" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
