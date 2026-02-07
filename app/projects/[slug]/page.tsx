import { notFound } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/shell/AppShell";
import { PageTransition } from "@/components/motion/PageTransition";
import { FadeIn } from "@/components/motion/FadeIn";
import { getProjectBySlug, getProjectSlugs } from "@/lib/data/projects";
import { ROUTES } from "@/lib/routes";
import { Heading } from "@/components/ui/Heading";
import { Button } from "@/components/ui/button";

interface ProjectPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getProjectSlugs().map((slug) => ({ slug }));
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) notFound();

  return (
    <AppShell>
      <PageTransition className="mx-auto max-w-6xl px-4 py-12">
        <FadeIn>
          <Button variant="ghost" size="sm" className="text-textMuted" asChild>
            <Link href={ROUTES.projects}>← Projects</Link>
          </Button>
        </FadeIn>
        <FadeIn delay={0.1}>
          <Heading as="h1" className="mt-4">
            {project.title}
          </Heading>
        </FadeIn>
        <FadeIn delay={0.15}>
          <p className="mt-2 text-textMuted">{project.description}</p>
        </FadeIn>
        {project.year && (
          <FadeIn delay={0.2}>
            <p className="mt-2 text-sm text-textMuted">{project.year}</p>
          </FadeIn>
        )}
      </PageTransition>
    </AppShell>
  );
}
