export type QualityTier = 1 | 2 | 3;

export interface Project {
  slug: string;
  title: string;
  description: string;
  year?: number;
  tags?: string[];
  href?: string;
  image?: string;
}

export interface Skill {
  id: string;
  label: string;
  category?: string;
}

export interface Experiment {
  id: string;
  title: string;
  description: string;
  tags?: string[];
}
