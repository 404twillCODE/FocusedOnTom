import type { PersonalStatus } from "@/lib/explore/types";
import { STATUS_LABELS } from "@/lib/explore/types";
import { STATUS_COLORS } from "@/lib/explore/constants";

export function StatusBadge({ status }: { status: PersonalStatus }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-2.5 py-0.5 text-[10px] font-medium tracking-[0.14em] uppercase"
      style={{ color: STATUS_COLORS[status] }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: STATUS_COLORS[status] }}
      />
      {STATUS_LABELS[status]}
    </span>
  );
}
