// Skills manifest.
// Edit this file to add / remove / adjust skills. The Skills page renders from here.
//
// Levels:
//   "daily"       -> I work with this all the time.
//   "comfortable" -> I reach for this regularly and know my way around.
//   "learning"    -> Actively picking it up right now.
//   "exploring"   -> Have touched it, want to go deeper.

export type SkillLevel = "daily" | "comfortable" | "learning" | "exploring";

export type Skill = {
  name: string;
  level: SkillLevel;
  note?: string;
};

export type SkillGroup = {
  title: string;
  description?: string;
  skills: Skill[];
};

export const skillGroups: SkillGroup[] = [
  {
    title: "Languages",
    description: "What I write in most.",
    skills: [
      { name: "TypeScript", level: "daily" },
      { name: "JavaScript", level: "daily" },
      { name: "HTML & CSS", level: "daily" },
      { name: "SQL", level: "comfortable" },
      { name: "Python", level: "comfortable" },
      { name: "Java", level: "exploring" },
      { name: "C", level: "exploring" },
    ],
  },
  {
    title: "Frameworks & libraries",
    description: "How I build the web.",
    skills: [
      { name: "React", level: "daily" },
      { name: "Next.js", level: "daily" },
      { name: "Tailwind CSS", level: "daily" },
      { name: "Framer Motion", level: "comfortable" },
      { name: "Node.js", level: "comfortable" },
      { name: "Three.js / R3F", level: "learning" },
    ],
  },
  {
    title: "Tools & platforms",
    description: "What I ship with.",
    skills: [
      { name: "Git & GitHub", level: "daily" },
      { name: "Vercel", level: "daily" },
      { name: "Supabase", level: "comfortable" },
      { name: "Figma", level: "comfortable" },
      { name: "VS Code / Cursor", level: "daily" },
      { name: "Docker", level: "exploring" },
    ],
  },
  {
    title: "Design & craft",
    description: "How I think about product.",
    skills: [
      { name: "UI / UX design", level: "comfortable" },
      { name: "Design systems", level: "comfortable" },
      { name: "Photography", level: "comfortable" },
      { name: "Motion & interaction", level: "comfortable" },
      { name: "Typography", level: "learning" },
    ],
  },
];

export const learningNow: { title: string; detail: string }[] = [
  {
    title: "Data structures & algorithms",
    detail: "Working through the classics — trees, graphs, dynamic programming.",
  },
  {
    title: "Systems fundamentals",
    detail: "Operating systems, networking, and how things run under the hood.",
  },
  {
    title: "3D on the web",
    detail: "Three.js and React Three Fiber — shaders, lighting, scene composition.",
  },
];

export const levelMeta: Record<
  SkillLevel,
  { label: string; dots: number; tone: "ice" | "muted" }
> = {
  daily: { label: "Daily", dots: 4, tone: "ice" },
  comfortable: { label: "Comfortable", dots: 3, tone: "ice" },
  learning: { label: "Learning", dots: 2, tone: "muted" },
  exploring: { label: "Exploring", dots: 1, tone: "muted" },
};
