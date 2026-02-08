import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dev & projects — Focused on Tom",
  description: "Projects and things I've built — apps, tools, experiments.",
};

export default function DevLayout({
  children,
}: { children: React.ReactNode }) {
  return children;
}
