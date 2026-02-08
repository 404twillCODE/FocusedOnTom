import { notFound } from "next/navigation";
import { getProjectBySlug, getProjectSlugs, getProjectNav } from "@/lib/data/projects";
import { ProjectDocumentaryPage } from "@/components/projects/ProjectDocumentaryPage";

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

  const { prev, next } = getProjectNav(slug);

  return (
    <ProjectDocumentaryPage
      project={project}
      prev={prev}
      next={next}
    />
  );
}
