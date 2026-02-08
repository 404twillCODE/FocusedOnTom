export type QualityTier = 1 | 2 | 3;

export type ProjectStatus = "Live" | "Building" | "Archived" | "Concept";

export interface ProjectLink {
  label: string;
  href: string;
}

export interface ProjectStackDetail {
  name: string;
  notes: string;
}

export interface ProjectGalleryItem {
  type: "image";
  src: string;
  caption: string;
}

export interface Project {
  slug: string;
  name: string;
  tagline: string;
  category: string;
  status: ProjectStatus;
  tech: string[];
  year?: number;
  featured: boolean;

  overview: string;
  problem: string;
  solution: string;

  highlights: string[];

  stackDetails: ProjectStackDetail[];

  links: ProjectLink[];

  gallery: ProjectGalleryItem[];

  roadmap: string[];
}

export interface Skill {
  id: string;
  label: string;
  category?: string;
}

export type SkillClusterRegion = "core" | "creative" | "systems" | "experimental";

/** Skill cluster: level/confidence 0–100, years, keywords, usedIn, spatial (anchor/cluster/weight). */
export interface SkillCluster {
  id: string;
  label: string;
  level: number;
  color: string;
  tech: string[];
  summary: string;
  category?: string;
  /** Years of experience (optional). */
  years?: number;
  /** Confidence 0–100 (optional). */
  confidence?: number;
  /** Keywords for search/display. */
  keywords?: string[];
  /** Project slugs where this skill is used. */
  usedIn?: string[];
  /** Acts as gravity center for this cluster. */
  anchor?: boolean;
  /** Cluster region for layout. */
  cluster?: SkillClusterRegion;
  /** 1–5: affects orbit distance and glow (higher = closer / stronger). */
  weight?: number;
}

export interface Experiment {
  id: string;
  title: string;
  description: string;
  tags?: string[];
}
