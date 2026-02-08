import { getProjects, getProjectCategories, getProjectStatuses } from "@/lib/data/projects";
import { ProjectsPageClient } from "@/components/projects/ProjectsPageClient";

export default function ProjectsPage() {
  const projects = getProjects();
  const categories = getProjectCategories();
  const statuses = getProjectStatuses();

  return (
    <ProjectsPageClient
      projects={projects}
      categories={categories}
      statuses={statuses}
    />
  );
}
