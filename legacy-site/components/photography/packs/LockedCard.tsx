export function LockedCard() {
  return (
    <article className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl">
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-cyan-950/50">
        <div className="absolute inset-0 scale-110 bg-[radial-gradient(circle_at_20%_20%,rgba(125,211,252,0.2),transparent_60%)] blur-2xl" />
        <div className="absolute inset-0 flex items-center justify-center backdrop-blur-sm">
          <span className="text-3xl font-black tracking-[0.2em] text-white/30">???</span>
        </div>
      </div>
      <p className="mt-3 text-center text-xs uppercase tracking-[0.16em] text-white/45">
        Locked slot
      </p>
    </article>
  );
}
