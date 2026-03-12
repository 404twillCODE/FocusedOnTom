"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Settings,
  Bell,
  TrendingUp,
  CheckCircle2,
  Clock,
} from "lucide-react";

const navItems = [
  { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { id: "projects", icon: FolderKanban, label: "Projects" },
  { id: "team", icon: Users, label: "Team" },
  { id: "settings", icon: Settings, label: "Settings" },
];

const initialTasks = [
  { id: "1", name: "Review Q1 report", project: "Acme Co", due: "Today", done: true },
  { id: "2", name: "Design system audit", project: "Beta", due: "Tomorrow", done: false },
  { id: "3", name: "API integration", project: "Gamma", due: "Mar 15", done: false },
];

const notifications = [
  { id: "n1", text: "New comment on Design system audit", time: "2m ago" },
  { id: "n2", text: "Project Gamma deadline updated", time: "1h ago" },
  { id: "n3", text: "Team member joined Beta", time: "Yesterday" },
];

export default function CustomTemplatePage() {
  const [activeNav, setActiveNav] = useState("dashboard");
  const [tasks, setTasks] = useState(initialTasks);
  const [tasksCompleted, setTasksCompleted] = useState(84);
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, done: !t.done } : t
      )
    );
    const task = tasks.find((t) => t.id === id);
    if (task?.done) {
      setTasksCompleted((c) => Math.max(0, c - 1));
    } else {
      setTasksCompleted((c) => c + 1);
    }
  };

  const doneCount = tasks.filter((t) => t.done).length;

  return (
    <div
      className="flex min-h-screen font-sans antialiased"
      style={{
        backgroundColor: "#f1f5f9",
        color: "#0f172a",
      }}
    >
      {/* Sidebar */}
      <aside
        className="flex w-56 shrink-0 flex-col border-r"
        style={{
          backgroundColor: "#1e293b",
          borderColor: "#334155",
        }}
      >
        <div className="flex h-14 items-center gap-2 px-4">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold"
            style={{ backgroundColor: "#6366f1", color: "#fff" }}
          >
            T
          </div>
          <span className="font-semibold text-white">TaskFlow</span>
        </div>
        <nav className="mt-6 flex flex-col gap-1 px-3">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveNav(item.id)}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors"
              style={{
                backgroundColor: activeNav === item.id ? "rgba(99, 102, 241, 0.2)" : "transparent",
                color: activeNav === item.id ? "#a5b4fc" : "#94a3b8",
              }}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className="flex h-14 items-center justify-between border-b px-6"
          style={{
            backgroundColor: "#ffffff",
            borderColor: "#e2e8f0",
          }}
        >
          <h1 className="text-lg font-semibold" style={{ color: "#0f172a" }}>
            {navItems.find((n) => n.id === activeNav)?.label ?? "Dashboard"}
          </h1>
          <div className="relative" ref={bellRef}>
            <button
              type="button"
              onClick={() => setBellOpen((o) => !o)}
              className="relative rounded-full p-2 transition-colors hover:bg-[#f1f5f9]"
              style={{ color: "#64748b" }}
            >
              <Bell className="h-5 w-5" />
              <span
                className="absolute right-1 top-1 h-2 w-2 rounded-full"
                style={{ backgroundColor: "#6366f1" }}
              />
            </button>
            {bellOpen && (
              <div
                className="absolute right-0 top-full z-50 mt-1 w-72 overflow-hidden rounded-xl border bg-white py-2 shadow-lg"
                style={{ borderColor: "#e2e8f0" }}
              >
                <div className="border-b px-4 py-2" style={{ borderColor: "#e2e8f0" }}>
                  <p className="text-sm font-medium" style={{ color: "#0f172a" }}>
                    Notifications
                  </p>
                </div>
                {notifications.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    className="block w-full px-4 py-3 text-left text-sm transition-colors hover:bg-[#f8fafc]"
                    style={{ color: "#475569" }}
                    onClick={() => setBellOpen(false)}
                  >
                    <p>{n.text}</p>
                    <p className="mt-0.5 text-xs" style={{ color: "#94a3b8" }}>
                      {n.time}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 p-6">
          <div className="mx-auto max-w-4xl">
            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div
                className="rounded-xl border bg-white p-5"
                style={{ borderColor: "#e2e8f0" }}
              >
                <p className="text-sm font-medium" style={{ color: "#64748b" }}>
                  Active projects
                </p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-bold" style={{ color: "#0f172a" }}>
                    12
                  </span>
                  <span className="text-xs" style={{ color: "#6366f1" }}>
                    +2
                  </span>
                </div>
              </div>
              <div
                className="rounded-xl border bg-white p-5"
                style={{ borderColor: "#e2e8f0" }}
              >
                <p className="text-sm font-medium" style={{ color: "#64748b" }}>
                  Tasks completed
                </p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-bold" style={{ color: "#0f172a" }}>
                    {tasksCompleted}
                  </span>
                  <span className="text-xs" style={{ color: "#6366f1" }}>
                    this week
                  </span>
                </div>
              </div>
              <div
                className="rounded-xl border bg-white p-5"
                style={{ borderColor: "#e2e8f0" }}
              >
                <p className="text-sm font-medium" style={{ color: "#64748b" }}>
                  Team members
                </p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-bold" style={{ color: "#0f172a" }}>
                    8
                  </span>
                </div>
              </div>
            </div>

            {/* Tasks */}
            <section className="mt-8">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold" style={{ color: "#0f172a" }}>
                  Upcoming tasks
                </h2>
                <span className="text-sm" style={{ color: "#64748b" }}>
                  {doneCount} of {tasks.length} done
                </span>
              </div>
              <div
                className="mt-4 overflow-hidden rounded-xl border bg-white"
                style={{ borderColor: "#e2e8f0" }}
              >
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ backgroundColor: "#f8fafc" }}>
                      <th className="px-4 py-3 text-left font-medium" style={{ color: "#64748b" }}>
                        Task
                      </th>
                      <th className="px-4 py-3 text-left font-medium" style={{ color: "#64748b" }}>
                        Project
                      </th>
                      <th className="px-4 py-3 text-left font-medium" style={{ color: "#64748b" }}>
                        Due
                      </th>
                      <th className="px-4 py-3 text-left font-medium" style={{ color: "#64748b" }}>
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((row) => (
                      <tr
                        key={row.id}
                        className="border-t"
                        style={{ borderColor: "#e2e8f0" }}
                      >
                        <td className="px-4 py-3 font-medium" style={{ color: "#0f172a" }}>
                          {row.name}
                        </td>
                        <td className="px-4 py-3" style={{ color: "#64748b" }}>
                          {row.project}
                        </td>
                        <td className="px-4 py-3" style={{ color: "#64748b" }}>
                          {row.due}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => toggleTask(row.id)}
                            className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium transition-colors hover:opacity-80"
                            style={{
                              color: row.done ? "#059669" : "#f59e0b",
                              backgroundColor: row.done ? "rgba(5, 150, 105, 0.15)" : "rgba(245, 158, 11, 0.15)",
                            }}
                          >
                            {row.done ? (
                              <>
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Done
                              </>
                            ) : (
                              <>
                                <Clock className="h-3.5 w-3.5" />
                                Mark done
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Chart placeholder */}
            <section className="mt-8">
              <h2 className="text-lg font-semibold" style={{ color: "#0f172a" }}>
                Activity
              </h2>
              <div
                className="mt-4 flex h-48 items-center justify-center rounded-xl border bg-white"
                style={{ borderColor: "#e2e8f0", color: "#94a3b8" }}
              >
                <div className="flex flex-col items-center gap-2">
                  <TrendingUp className="h-10 w-10" />
                  <span className="text-sm">Chart placeholder</span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      <Link
        href="/websites"
        className="fixed bottom-4 right-4 rounded-full px-3 py-1.5 text-xs opacity-50 hover:opacity-100"
        style={{
          backgroundColor: "#1e293b",
          color: "#94a3b8",
        }}
      >
        Template demo
      </Link>
    </div>
  );
}
