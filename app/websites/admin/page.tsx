"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, LogOut, Plus, Save, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminPasscodeGate, getAdminGateUnlocked } from "./AdminPasscodeGate";
import { AdminAuth } from "./AdminAuth";

type PipelineStage = "new_lead" | "in_progress" | "completed" | "paused";
type ContactMethod = "text" | "call" | "email";
type Priority = "low" | "medium" | "high";

type Lead = {
  id: string;
  user_id: string;
  business_name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  website_url: string | null;
  pipeline_stage: PipelineStage;
  preferred_method: ContactMethod;
  priority: Priority;
  next_follow_up: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type Notepad = {
  id: string;
  user_id: string;
  content: string;
  updated_at: string;
};

const ADMIN_GATE_ENABLED = process.env.NEXT_PUBLIC_ADMIN_GATE_ENABLED !== "false";

const stageOptions: Array<{ value: PipelineStage; label: string }> = [
  { value: "new_lead", label: "New Lead" },
  { value: "in_progress", label: "Website In Progress" },
  { value: "completed", label: "Completed Website" },
  { value: "paused", label: "Paused / Follow Up Later" },
];

const methodOptions: Array<{ value: ContactMethod; label: string }> = [
  { value: "text", label: "Text" },
  { value: "call", label: "Cold Call" },
  { value: "email", label: "Email" },
];

const priorityOptions: Array<{ value: Priority; label: string }> = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const shellCardClass =
  "rounded-2xl border border-white/8 bg-[rgba(13,18,31,0.82)] shadow-[0_10px_30px_rgba(0,0,0,0.16)] backdrop-blur-sm";
const sectionCardClass = `${shellCardClass} p-4 sm:p-5`;
const statCardClass =
  "rounded-xl border border-white/8 bg-[rgba(255,255,255,0.02)] px-3 py-3";
const fieldClass =
  "h-10 rounded-lg border border-white/8 bg-[rgba(255,255,255,0.02)] px-3 text-sm text-[var(--text)] outline-none transition-colors focus:border-[var(--ice)]/50";
const textAreaClass =
  "w-full rounded-lg border border-white/8 bg-[rgba(255,255,255,0.02)] p-3 text-sm text-[var(--text)] outline-none transition-colors focus:border-[var(--ice)]/50";
const primaryButtonClass =
  "h-9 rounded-lg border border-[var(--ice)]/20 bg-[var(--iceSoft)]/15 px-3 py-0 text-sm text-[var(--text)] hover:border-[var(--ice)]/45 hover:bg-[var(--iceSoft)]/25 hover:text-[var(--ice)]";
const subtleButtonClass =
  "h-9 rounded-lg border border-white/8 bg-[rgba(255,255,255,0.02)] px-3 py-0 text-sm text-[var(--textMuted)] hover:border-[var(--ice)]/30 hover:bg-[var(--iceSoft)]/10 hover:text-[var(--text)]";

function emptyLeadDraft() {
  return {
    business_name: "",
    contact_name: "",
    phone: "",
    email: "",
    website_url: "",
    pipeline_stage: "new_lead" as PipelineStage,
    preferred_method: "call" as ContactMethod,
    priority: "medium" as Priority,
    next_follow_up: "",
    notes: "",
  };
}

function formatDate(value: string | null): string {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString();
}

function getStageLabel(stage: PipelineStage): string {
  return stageOptions.find((option) => option.value === stage)?.label ?? stage;
}

export default function AdminPage() {
  const [mounted, setMounted] = useState(false);
  const [gateUnlocked, setGateUnlocked] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [savingLead, setSavingLead] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [draft, setDraft] = useState(emptyLeadDraft());
  const [leadError, setLeadError] = useState("");

  const [notepadId, setNotepadId] = useState<string | null>(null);
  const [notepad, setNotepad] = useState("");
  const [savingNotepad, setSavingNotepad] = useState(false);
  const [notepadMessage, setNotepadMessage] = useState("");

  const selectedLead = useMemo(
    () => leads.find((item) => item.id === selectedLeadId) ?? null,
    [leads, selectedLeadId]
  );

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoadingLeads(true);
    setLeadError("");
    try {
      const [{ data: leadsData, error: leadsError }, { data: notepadData, error: noteError }] =
        await Promise.all([
          supabase
            .from("admin_leads")
            .select("*")
            .order("updated_at", { ascending: false }),
          supabase.from("admin_notepad").select("*").limit(1).maybeSingle(),
        ]);

      if (leadsError) throw leadsError;
      if (noteError) throw noteError;

      setLeads((leadsData as Lead[]) ?? []);
      const note = (notepadData as Notepad | null) ?? null;
      setNotepadId(note?.id ?? null);
      setNotepad(note?.content ?? "");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load admin data.";
      setLeadError(msg);
    } finally {
      setLoadingLeads(false);
    }
  }, [user]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const unlocked = !ADMIN_GATE_ENABLED || getAdminGateUnlocked();
    setGateUnlocked(unlocked);
  }, [mounted]);

  useEffect(() => {
    if (!mounted || !gateUnlocked) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthChecked(true);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, [mounted, gateUnlocked]);

  useEffect(() => {
    if (!user) return;
    void loadData();
  }, [user, loadData]);

  function clearForm() {
    setSelectedLeadId(null);
    setDraft(emptyLeadDraft());
  }

  function useLeadForEdit(lead: Lead) {
    setSelectedLeadId(lead.id);
    setDraft({
      business_name: lead.business_name ?? "",
      contact_name: lead.contact_name ?? "",
      phone: lead.phone ?? "",
      email: lead.email ?? "",
      website_url: lead.website_url ?? "",
      pipeline_stage: lead.pipeline_stage,
      preferred_method: lead.preferred_method,
      priority: lead.priority,
      next_follow_up: lead.next_follow_up ?? "",
      notes: lead.notes ?? "",
    });
  }

  async function saveLead() {
    if (!user) return;
    if (!draft.business_name.trim()) {
      setLeadError("Business name is required.");
      return;
    }
    setSavingLead(true);
    setLeadError("");

    const payload = {
      business_name: draft.business_name.trim(),
      contact_name: draft.contact_name.trim() || null,
      phone: draft.phone.trim() || null,
      email: draft.email.trim() || null,
      website_url: draft.website_url.trim() || null,
      pipeline_stage: draft.pipeline_stage,
      preferred_method: draft.preferred_method,
      priority: draft.priority,
      next_follow_up: draft.next_follow_up || null,
      notes: draft.notes.trim() || null,
      user_id: user.id,
    };

    try {
      if (selectedLead) {
        const { data, error } = await supabase
          .from("admin_leads")
          .update(payload)
          .eq("id", selectedLead.id)
          .select("*")
          .single();
        if (error) throw error;
        setLeads((prev) => prev.map((item) => (item.id === selectedLead.id ? (data as Lead) : item)));
      } else {
        const { data, error } = await supabase
          .from("admin_leads")
          .insert(payload)
          .select("*")
          .single();
        if (error) throw error;
        setLeads((prev) => [data as Lead, ...prev]);
      }
      clearForm();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save lead.";
      setLeadError(msg);
    } finally {
      setSavingLead(false);
    }
  }

  async function deleteLead(id: string) {
    setLeadError("");
    try {
      const { error } = await supabase.from("admin_leads").delete().eq("id", id);
      if (error) throw error;
      setLeads((prev) => prev.filter((item) => item.id !== id));
      if (selectedLeadId === id) clearForm();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete lead.";
      setLeadError(msg);
    }
  }

  async function saveNotepad() {
    if (!user) return;
    setSavingNotepad(true);
    setNotepadMessage("");
    try {
      if (notepadId) {
        const { data, error } = await supabase
          .from("admin_notepad")
          .update({ content: notepad, user_id: user.id })
          .eq("id", notepadId)
          .select("*")
          .single();
        if (error) throw error;
        setNotepadId((data as Notepad).id);
      } else {
        const { data, error } = await supabase
          .from("admin_notepad")
          .upsert({ user_id: user.id, content: notepad }, { onConflict: "user_id" })
          .select("*")
          .single();
        if (error) throw error;
        setNotepadId((data as Notepad).id);
      }
      setNotepadMessage("Saved");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save note.";
      setNotepadMessage(msg);
    } finally {
      setSavingNotepad(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
  }

  if (!mounted) {
    return (
      <main className="min-h-screen">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-pulse rounded-full bg-[var(--ice)]/30" />
        </div>
      </main>
    );
  }

  const showGate = ADMIN_GATE_ENABLED && !gateUnlocked;
  const showAuth = gateUnlocked && authChecked && !user;
  const showApp = gateUnlocked && authChecked && !!user;

  const stageCounts = {
    new_lead: leads.filter((x) => x.pipeline_stage === "new_lead").length,
    in_progress: leads.filter((x) => x.pipeline_stage === "in_progress").length,
    completed: leads.filter((x) => x.pipeline_stage === "completed").length,
    paused: leads.filter((x) => x.pipeline_stage === "paused").length,
  };

  return (
    <main className="min-h-screen pt-4 sm:pt-5">
      <div className="mx-auto w-full max-w-6xl px-4 pt-0 pb-8">
        <AnimatePresence mode="wait">
          {showGate ? (
            <motion.div key="gate" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <AdminPasscodeGate onUnlock={() => setGateUnlocked(true)} />
            </motion.div>
          ) : null}

          {showAuth ? (
            <motion.div key="auth" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <AdminAuth
                onSignedIn={() => {
                  supabase.auth.getSession().then(({ data: { session } }) => {
                    setUser(session?.user ?? null);
                  });
                }}
              />
            </motion.div>
          ) : null}

          {showApp && user ? (
            <motion.section
              key="app"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <div className={`${sectionCardClass} pt-4`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--ice)]/75">
                      Admin Dashboard
                    </p>
                    <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--text)]">
                      Business admin CRM
                    </h1>
                    <p className="mt-1 text-sm text-[var(--textMuted)]">
                      Track outreach, pipeline status, and client notes.
                    </p>
                    <p className="mt-2 text-xs text-[var(--textMuted)]/80">
                      Signed in as {user.email ?? "your Supabase account"}
                    </p>
                  </div>
                  <Button
                    onClick={signOut}
                    className={`${subtleButtonClass} shrink-0`}
                  >
                    <LogOut className="mr-1.5 h-4 w-4" />
                    Sign out
                  </Button>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-4">
                  <div className={statCardClass}>
                    <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--textMuted)]">
                      New leads
                    </p>
                    <p className="mt-2 text-xl font-semibold text-[var(--text)]">{stageCounts.new_lead}</p>
                  </div>
                  <div className={statCardClass}>
                    <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--textMuted)]">
                      In progress
                    </p>
                    <p className="mt-2 text-xl font-semibold text-[var(--text)]">{stageCounts.in_progress}</p>
                  </div>
                  <div className={statCardClass}>
                    <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--textMuted)]">
                      Completed
                    </p>
                    <p className="mt-2 text-xl font-semibold text-[var(--text)]">{stageCounts.completed}</p>
                  </div>
                  <div className={statCardClass}>
                    <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--textMuted)]">
                      Paused
                    </p>
                    <p className="mt-2 text-xl font-semibold text-[var(--text)]">{stageCounts.paused}</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
                <section className={sectionCardClass}>
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="font-medium text-[var(--text)]">
                        {selectedLead ? "Edit lead" : "Add new lead"}
                      </h2>
                      <p className="mt-1 text-sm text-[var(--textMuted)]">
                        Keep your outreach details clean and easy to update.
                      </p>
                    </div>
                    <Button className={subtleButtonClass} onClick={clearForm}>
                      <Plus className="mr-1.5 h-4 w-4" />
                      Clear
                    </Button>
                  </div>
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    <Input
                      className={fieldClass}
                      placeholder="Business name"
                      value={draft.business_name}
                      onChange={(e) => setDraft((prev) => ({ ...prev, business_name: e.target.value }))}
                    />
                    <Input
                      className={fieldClass}
                      placeholder="Contact name"
                      value={draft.contact_name}
                      onChange={(e) => setDraft((prev) => ({ ...prev, contact_name: e.target.value }))}
                    />
                    <Input
                      className={fieldClass}
                      placeholder="Phone"
                      value={draft.phone}
                      onChange={(e) => setDraft((prev) => ({ ...prev, phone: e.target.value }))}
                    />
                    <Input
                      className={fieldClass}
                      placeholder="Email"
                      value={draft.email}
                      onChange={(e) => setDraft((prev) => ({ ...prev, email: e.target.value }))}
                    />
                    <Input
                      className={fieldClass}
                      placeholder="Website URL"
                      value={draft.website_url}
                      onChange={(e) => setDraft((prev) => ({ ...prev, website_url: e.target.value }))}
                    />
                    <Input
                      className={fieldClass}
                      type="date"
                      value={draft.next_follow_up}
                      onChange={(e) => setDraft((prev) => ({ ...prev, next_follow_up: e.target.value }))}
                    />
                    <select
                      value={draft.pipeline_stage}
                      onChange={(e) =>
                        setDraft((prev) => ({ ...prev, pipeline_stage: e.target.value as PipelineStage }))
                      }
                      className={fieldClass}
                    >
                      {stageOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <select
                      value={draft.preferred_method}
                      onChange={(e) =>
                        setDraft((prev) => ({ ...prev, preferred_method: e.target.value as ContactMethod }))
                      }
                      className={fieldClass}
                    >
                      {methodOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <select
                      value={draft.priority}
                      onChange={(e) => setDraft((prev) => ({ ...prev, priority: e.target.value as Priority }))}
                      className={`${fieldClass} sm:col-span-2`}
                    >
                      {priorityOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label} priority
                        </option>
                      ))}
                    </select>
                    <textarea
                      value={draft.notes}
                      onChange={(e) => setDraft((prev) => ({ ...prev, notes: e.target.value }))}
                      placeholder="Call notes, context, objections, next steps..."
                      className={`${textAreaClass} min-h-32 sm:col-span-2`}
                    />
                  </div>
                  {leadError ? (
                    <div className="mt-3 rounded-lg border border-red-500/20 bg-red-500/8 px-3 py-2 text-sm text-red-300">
                      {leadError}
                    </div>
                  ) : null}
                  <Button className={`${primaryButtonClass} mt-4`} onClick={saveLead} disabled={savingLead}>
                    {savingLead ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save lead
                      </>
                    )}
                  </Button>
                </section>

                <section className={sectionCardClass}>
                  <h2 className="font-medium text-[var(--text)]">Personal notepad</h2>
                  <p className="mt-1 text-sm text-[var(--textMuted)]">
                    Save scripts, reminders, pricing notes, and follow-up ideas.
                  </p>
                  <textarea
                    value={notepad}
                    onChange={(e) => setNotepad(e.target.value)}
                    placeholder="Call script ideas, follow-up plan, and checklist..."
                    className={`${textAreaClass} mt-4 min-h-72`}
                  />
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Button
                      className={primaryButtonClass}
                      onClick={saveNotepad}
                      disabled={savingNotepad}
                    >
                      {savingNotepad ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save notepad
                        </>
                      )}
                    </Button>
                    {notepadMessage ? (
                      <span className="text-xs text-[var(--textMuted)]">{notepadMessage}</span>
                    ) : null}
                  </div>
                </section>
              </div>

              <section className={sectionCardClass}>
                <div className="mb-4">
                  <h2 className="font-medium text-[var(--text)]">Leads & clients</h2>
                  <p className="mt-1 text-sm text-[var(--textMuted)]">
                    Your saved businesses, outreach progress, and next actions.
                  </p>
                </div>
                {loadingLeads ? (
                  <div className="flex items-center gap-2 text-sm text-[var(--textMuted)]">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading leads...
                  </div>
                ) : leads.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-white/10 bg-[rgba(255,255,255,0.02)] px-4 py-5 text-sm text-[var(--textMuted)]">
                    No leads yet. Add your first business above to start tracking outreach.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {leads.map((lead) => (
                      <div
                        key={lead.id}
                        className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-white/8 bg-[rgba(255,255,255,0.02)] p-4"
                      >
                        <div className="space-y-1">
                          <p className="font-medium text-[var(--text)]">{lead.business_name}</p>
                          <p className="text-sm text-[var(--textMuted)]">
                            {lead.contact_name || "No contact name"} | {lead.phone || "No phone"}
                          </p>
                          <div className="flex flex-wrap gap-2 text-xs">
                            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[var(--textMuted)]">
                              {getStageLabel(lead.pipeline_stage)}
                            </span>
                            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[var(--textMuted)]">
                              {lead.preferred_method.toUpperCase()}
                            </span>
                            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[var(--textMuted)]">
                              {lead.priority.toUpperCase()} priority
                            </span>
                          </div>
                          <p className="text-xs text-[var(--textMuted)]/90">
                            Next follow up: {formatDate(lead.next_follow_up)} | Updated {formatDate(lead.updated_at)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button className={subtleButtonClass} onClick={() => useLeadForEdit(lead)}>
                            Edit
                          </Button>
                          <Button className={subtleButtonClass} onClick={() => deleteLead(lead.id)}>
                            <Trash2 className="mr-1.5 h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </motion.section>
          ) : null}
        </AnimatePresence>
      </div>
    </main>
  );
}
