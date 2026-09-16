import type { Metadata } from "next";
import { ProjectsView } from "./projects-view.client";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Things I've been building — Nodexity, PullUp, and other side projects.",
};

export default function ProjectsPage() {
  return <ProjectsView />;
}
