import { redirect } from "next/navigation";
import { requireExploreAdmin } from "@/lib/explore/auth";
import { getCommunitySubmissions, getPlaces } from "@/lib/explore/data";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { AdminLogoutButton } from "@/components/explore/AdminLogoutButton";
import { AdminPlaceList } from "@/components/explore/AdminPlaceList";
import { OfficialImports } from "@/components/explore/OfficialImports";
import { reviewCommunity } from "./actions";

export default async function ExploreAdminPage() {
  const user = await requireExploreAdmin();
  if (!user) redirect("/explore/admin/login");

  const supabase = createServiceSupabaseClient();
  const places = await getPlaces({ includeHidden: true });
  const submissions = await getCommunitySubmissions({ includePending: true });
  const { data: logs } = await supabase
    .from("import_logs")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(8);
  const { data: source } = await supabase
    .from("official_sources")
    .select("last_imported_at")
    .eq("id", "nys-dec-backcountry")
    .maybeSingle();

  const lastImported = source?.last_imported_at as string | null | undefined;
  const campsiteCount = places.filter((p) => p.type === "primitive_campsite" && p.officialSourceId === "nys-dec-backcountry").length;
  const leantoCount = places.filter((p) => p.type === "lean_to" && p.officialSourceId === "nys-dec-backcountry").length;

  return (
    <section className="pb-24 pt-8">
      <div className="container-page">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">Explore admin</h1>
            <p className="mt-2 max-w-xl text-sm text-[var(--text-muted)]">
              Signed in as {user.email}. Status, visits, and imports persist in
              Supabase — not this browser.
            </p>
          </div>
          <AdminLogoutButton />
        </div>

        <OfficialImports
          cards={[
            {
              dataset: "primitive_campsites",
              title: "NYS DEC — Primitive Campsites",
              count: campsiteCount,
              lastImported,
            },
            {
              dataset: "lean_tos",
              title: "NYS DEC — Lean-tos",
              count: leantoCount,
              lastImported,
            },
          ]}
          logs={(logs ?? []).map((log) => ({
            id: log.id,
            status: log.status,
            started_at: log.started_at,
            records_created: log.records_created,
            records_updated: log.records_updated,
            records_skipped: log.records_skipped,
            records_failed: log.records_failed,
            records_received: log.records_received,
            error_message: log.error_message,
            metadata_json: log.metadata_json,
          }))}
        />

        <h2 className="mt-12 text-lg font-medium">Places</h2>
        <AdminPlaceList places={places} />

        <h2 className="mt-12 text-lg font-medium">Community moderation</h2>
        <ul className="mt-4 space-y-3">
          {submissions.length === 0 && (
            <li className="text-sm text-[var(--text-muted)]">No submissions.</li>
          )}
          {submissions.map((item) => (
            <li key={item.id} className="rounded-xl border border-white/10 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">
                {item.status} · {item.kind}
              </p>
              <p className="mt-2 text-sm">
                {item.username} — {item.body}
              </p>
              {item.status === "pending" && (
                <div className="mt-3 flex gap-2">
                  <form action={reviewCommunity.bind(null, item.id, "approved")}>
                    <button
                      type="submit"
                      className="rounded-full border border-white/10 px-3 py-1 text-xs"
                    >
                      Approve
                    </button>
                  </form>
                  <form action={reviewCommunity.bind(null, item.id, "rejected")}>
                    <button
                      type="submit"
                      className="rounded-full border border-white/10 px-3 py-1 text-xs"
                    >
                      Reject
                    </button>
                  </form>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
