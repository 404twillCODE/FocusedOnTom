import Link from "next/link";
import { AppShell } from "@/components/shell/AppShell";
import { FadeIn } from "@/components/motion/FadeIn";
import { getProjects } from "@/lib/data/projects";
import { ROUTES } from "@/lib/routes";
import { GlassPanel } from "@/components/shell/GlassPanel";
import { Heading } from "@/components/ui/Heading";
import { Button } from "@/components/ui/button";

export default function ProjectsPage() {
  const projects = getProjects();

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-12">
        <FadeIn>
          <Heading as="h1">Projects</Heading>
        </FadeIn>
        <FadeIn delay={0.1}>
          <p className="mt-2 text-textMuted">Selection of work.</p>
        </FadeIn>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {projects.map((project, i) => (
            <FadeIn key={project.slug} delay={0.15 + i * 0.05}>
              <GlassPanel variant="panel" glow="none" className="p-4">
                <h2 className="font-semibold text-text">{project.title}</h2>
                <p className="mt-1 text-sm text-textMuted">{project.description}</p>
                <Button variant="link" className="mt-2 p-0 text-mint hover:text-mint" asChild>
                  <Link href={ROUTES.project(project.slug)}>View →</Link>
                </Button>
              </GlassPanel>
            </FadeIn>
          ))}
        </ul>
      </div>
    </AppShell>
  );
}
