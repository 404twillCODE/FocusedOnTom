"use client";

import { useEffect, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { Send, MessageCircle, Users, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase/client";

type Room = {
  id: string;
  type: "group" | "dm";
  name: string | null;
};

type Message = {
  id: string;
  room_id: string;
  user_id: string;
  body: string;
  created_at: string;
  author_name?: string;
};

export function ChatShell({ userId }: { userId: string }) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadRooms() {
      setLoadingRooms(true);
      setError(null);
      try {
        // Ensure a global Gym Chat room exists and that the user is a member.
        const { data: existingRoomData, error: existingErr } = await supabase
          .from("chat_rooms")
          .select("*")
          .eq("type", "group")
          .eq("name", "Gym Chat")
          .maybeSingle();
        if (existingErr && existingErr.code !== "PGRST116") throw existingErr;

        let groupRoom = existingRoomData as Room | null;
        if (!groupRoom) {
          const { data: created, error: createErr } = await supabase
            .from("chat_rooms")
            .insert({
              type: "group",
              name: "Gym Chat",
            })
            .select()
            .single();
          if (createErr) throw createErr;
          groupRoom = created as Room;
        }

        await supabase
          .from("chat_members")
          .upsert(
            {
              room_id: groupRoom.id,
              user_id: userId,
            },
            { onConflict: "room_id,user_id" }
          );

        const { data: allRooms, error: roomErr } = await supabase
          .from("chat_rooms")
          .select("*")
          .order("created_at", { ascending: true });
        if (roomErr) throw roomErr;
        if (cancelled) return;

        setRooms((allRooms ?? []) as Room[]);
        if (!activeRoomId && allRooms && allRooms.length > 0) {
          setActiveRoomId(allRooms[0].id);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load chat rooms.");
        }
      } finally {
        if (!cancelled) setLoadingRooms(false);
      }
    }

    loadRooms();
    return () => {
      cancelled = true;
    };
  }, [userId, activeRoomId]);

  useEffect(() => {
    if (!activeRoomId) return;
    let cancelled = false;
    setLoadingMessages(true);
    setMessages([]);

    supabase
      .from("chat_messages")
      .select("*")
      .eq("room_id", activeRoomId)
      .order("created_at", { ascending: true })
      .then(({ data, error: msgErr }) => {
        if (cancelled) return;
        if (msgErr) {
          setError(msgErr.message);
        } else {
          setMessages((data ?? []) as Message[]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingMessages(false);
      });

    const ch = supabase
      .channel(`chat-room-${activeRoomId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `room_id=eq.${activeRoomId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    setChannel((prev) => {
      if (prev) supabase.removeChannel(prev);
      return ch;
    });

    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, [activeRoomId]);

  async function handleSend() {
    const trimmed = body.trim();
    if (!trimmed || !activeRoomId) return;
    setBody("");
    const { error: insertErr } = await supabase.from("chat_messages").insert({
      room_id: activeRoomId,
      user_id: userId,
      body: trimmed,
    });
    if (insertErr) {
      setError(insertErr.message);
    }
  }

  const activeRoom = rooms.find((r) => r.id === activeRoomId) ?? null;

  return (
    <div className="flex h-[70vh] flex-col rounded-2xl border border-[var(--border)] bg-[var(--bg2)]/90">
      <div className="border-b border-amber-400/30 bg-amber-500/10 px-4 py-2 text-xs text-amber-200">
        Chat is a work in progress and currently not fully functional.
      </div>
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="mr-1 rounded-lg border border-[var(--border)] bg-[var(--bg3)]/80 p-1.5 text-[var(--textMuted)] hover:border-[var(--ice)]/50 hover:text-[var(--ice)] sm:hidden"
            onClick={() => setActiveRoomId(null)}
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[var(--iceSoft)] text-[var(--ice)]">
            <MessageCircle className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-[var(--text)]">
              {activeRoom?.type === "group" ? activeRoom.name ?? "Gym Chat" : "Direct messages"}
            </p>
            <p className="text-[10px] text-[var(--textMuted)]">Live with your workout crew</p>
          </div>
        </div>
      </div>
      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-40 flex-shrink-0 flex-col border-r border-[var(--border)] bg-[var(--bg3)]/80 px-2 py-2 text-xs text-[var(--textMuted)] sm:flex">
          <p className="mb-2 flex items-center gap-1 text-[10px] uppercase tracking-wide">
            <Users className="h-3 w-3" />
            Rooms
          </p>
          <div className="space-y-1">
            {rooms.map((room) => (
              <button
                key={room.id}
                type="button"
                onClick={() => setActiveRoomId(room.id)}
                className={`w-full rounded-xl px-2 py-1.5 text-left text-[11px] ${
                  room.id === activeRoomId
                    ? "bg-[var(--iceSoft)]/40 text-[var(--text)]"
                    : "text-[var(--textMuted)] hover:bg-[var(--bg2)]/80 hover:text-[var(--text)]"
                }`}
              >
                {room.type === "group" ? room.name ?? "Gym Chat" : "DM"}
              </button>
            ))}
          </div>
        </aside>
        <main className="flex min-w-0 flex-1 flex-col">
          <div className="flex-1 space-y-2 overflow-y-auto px-4 py-3 text-sm">
            {loadingMessages ? (
              <p className="text-xs text-[var(--textMuted)]">Loading messages…</p>
            ) : messages.length === 0 ? (
              <p className="text-xs text-[var(--textMuted)]">No messages yet. Say hi.</p>
            ) : (
              messages.map((m) => {
                const mine = m.user_id === userId;
                return (
                  <div
                    key={m.id}
                    className={`flex ${mine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs ${
                        mine
                          ? "bg-[var(--ice)] text-slate-950"
                          : "bg-[var(--bg3)]/90 text-[var(--text)]"
                      }`}
                    >
                      <p className="break-words">{m.body}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <form
            className="flex items-end gap-2 border-t border-[var(--border)] bg-[var(--bg2)]/90 px-3 py-2"
            onSubmit={(e) => {
              e.preventDefault();
              void handleSend();
            }}
          >
            <Input
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Message Gym Chat"
              className="flex-1 text-xs"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void handleSend();
                }
              }}
            />
            <Button
              type="submit"
              size="icon"
              className="h-8 w-8 rounded-full"
              disabled={!body.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </main>
      </div>
    </div>
  );
}

