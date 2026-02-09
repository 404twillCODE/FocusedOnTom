export type ProjectStatus = "Live" | "Building" | "Archived" | "Concept";

export interface ProjectLink {
  href: string;
  label: string;
}

export interface ProjectStackDetail {
  name: string;
  notes: string;
}

export interface Project {
  slug: string;
  title: string;
  name?: string;
  tagline?: string;
  tech: string[];
  status: ProjectStatus;
  summary?: string;
  description?: string;
  tags?: string[];
  category?: string;
  href?: string;
  repo?: string;
  year?: string | number;
  links?: ProjectLink[];
  overview?: string;
  problem?: string;
  solution?: string;
  highlights?: string[];
  stackDetails?: ProjectStackDetail[];
  gallery?: ProjectGalleryItem[];
  roadmap?: string[];
  [key: string]: unknown;
}

export interface ProjectGalleryItem {
  src: string;
  alt?: string;
  caption?: string;
  [key: string]: unknown;
}

export type SkillClusterRegion = "core" | "creative" | "systems" | "experimental";

export interface SkillCluster {
  id: string;
  label: string;
  summary?: string;
  level?: number;
  category?: string;
  tech?: string[];
  region?: SkillClusterRegion;
  cluster?: SkillClusterRegion;
  weight?: number;
  anchor?: boolean;
  color?: string;
  usedIn?: string[];
  years?: string | number;
  confidence?: string | number | null;
  keywords?: string[];
  [key: string]: unknown;
}
