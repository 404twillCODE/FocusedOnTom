"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { AdminGate } from "@/components/admin/AdminGate";

type Booking = {
  id: string;
  email: string;
  name: string;
  session_type: string;
  starts_at: string;
  notes: string | null;
  deposit_amount_cents: number;
  stripe_session_id: string | null;
  status: string;
  created_at: string;
};

const STATUSES = [
  "requested",
  "deposit_paid",
  "confirmed",
  "canceled",
  "completed",
];

function BookingsList() {
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const password = sessionStorage.getItem("admin_password") ?? "";
      const res = await fetch("/api/admin/photography/bookings", {
        headers: { "x-admin-password": password },
      });
      const data = (await res.json()) as {
        ok?: boolean;
        bookings?: Booking[];
        error?: string;
      };
      if (!res.ok || !data.ok)
        throw new Error(data.error ?? "Could not load bookings");
      setBookings(data.bookings ?? []);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function updateStatus(id: string, status: string) {
    setSaving(id);
    try {
      const password = sessionStorage.getItem("admin_password") ?? "";
      await fetch("/api/admin/photography/bookings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": password,
        },
        body: JSON.stringify({ id, status }),
      });
      await load();
    } finally {
      setSaving(null);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 pt-24 pb-16">
      <Link
        href="/admin/photography"
        className="inline-flex items-center gap-2 text-sm text-[var(--textMuted)] hover:text-[var(--ice)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to admin
      </Link>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--text)]">
        Session bookings
      </h1>

      {error && (
        <div className="mt-6 rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </div>
      )}

      {!bookings && !error && (
        <div className="mt-10 flex items-center gap-2 text-sm text-[var(--textMuted)]">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      )}

      {bookings && bookings.length === 0 && (
        <p className="mt-10 text-sm text-[var(--textMuted)]">
          No bookings yet.
        </p>
      )}

      {bookings && bookings.length > 0 && (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wider text-[var(--textMuted)]">
                <th className="py-3 pr-3">When</th>
                <th className="py-3 pr-3">Client</th>
                <th className="py-3 pr-3">Type</th>
                <th className="py-3 pr-3">Deposit</th>
                <th className="py-3 pr-3">Status</th>
                <th className="py-3 pr-3">Notes</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr
                  key={b.id}
                  className="border-b border-[var(--border)]/50 align-top text-[var(--text)]"
                >
                  <td className="py-3 pr-3 whitespace-nowrap">
                    {new Date(b.starts_at).toLocaleString()}
                  </td>
                  <td className="py-3 pr-3">
                    <div>{b.name}</div>
                    <div className="text-xs text-[var(--textMuted)]">
                      {b.email}
                    </div>
                  </td>
                  <td className="py-3 pr-3">{b.session_type}</td>
                  <td className="py-3 pr-3">
                    ${(b.deposit_amount_cents / 100).toFixed(2)}
                  </td>
                  <td className="py-3 pr-3">
                    <select
                      value={b.status}
                      disabled={saving === b.id}
                      onChange={(e) => updateStatus(b.id, e.target.value)}
                      className="rounded-md border border-[var(--border)] bg-[var(--bg3)]/60 px-2 py-1 text-xs"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="max-w-xs py-3 pr-3 text-xs text-[var(--textMuted)]">
                    {b.notes ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

export default function AdminBookingsPage() {
  return (
    <AdminGate>
      <BookingsList />
    </AdminGate>
  );
}
