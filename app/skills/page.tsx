"use client";

import { useState, useMemo } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { FadeIn } from "@/components/motion/FadeIn";
import { getSkillClusters, getSkillCategories } from "@/lib/data/skills";
import { useAppStore, type AppState } from "@/store/appStore";
import { SkillClusterView } from "@/components/skills/SkillCluster";
import { SkillDetailPanel } from "@/components/skills/SkillDetailPanel";
import { SkillMap } from "@/components/skills/SkillMap";
import { SkillFilters } from "@/components/skills/SkillFilters";
import type { SkillCluster } from "@/lib/types/content";

export default function SkillsPage() {
  const allClusters = useMemo(() => getSkillClusters(), []);
  const categories = useMemo(() => getSkillCategories(), []);
  const reducedMotion = useAppStore((s: AppState) => s.reducedMotion);
  const [selectedSkill, setSelectedSkill] = useState<SkillCluster | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sortByLevel, setSortByLevel] = useState(true);

  const clusters = useMemo(() => {
    let list = allClusters;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (s) =>
          s.label.toLowerCase().includes(q) ||
          s.summary.toLowerCase().includes(q) ||
          s.tech.some((t) => t.toLowerCase().includes(q)) ||
          (s.category ?? "").toLowerCase().includes(q)
      );
    }
    if (categoryFilter) {
      list = list.filter((s) => s.category === categoryFilter);
    }
    if (sortByLevel) {
      list = [...list].sort((a, b) => b.level - a.level);
    }
    return list;
  }, [allClusters, searchQuery, categoryFilter, sortByLevel]);

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-12">
        <FadeIn>
          <h1 className="text-4xl font-semibold tracking-tight text-text md:text-5xl">
            Skills Constellation
          </h1>
        </FadeIn>
        <FadeIn delay={0.05}>
          <p className="mt-2 text-textMuted">
            Hover nodes to highlight connections. Click to open details.
          </p>
        </FadeIn>

        <FadeIn delay={0.08}>
          <SkillFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            categoryFilter={categoryFilter}
            onCategoryChange={setCategoryFilter}
            categories={categories}
            sortByLevel={sortByLevel}
            onSortChange={setSortByLevel}
            className="mt-6"
          />
        </FadeIn>

        {/* Map view: md and up */}
        <FadeIn delay={0.1} className="mt-6 hidden md:block">
          {clusters.length > 0 ? (
            <SkillMap
              skills={clusters}
              reducedMotion={reducedMotion}
              hoveredId={hoveredId}
              onHoverChange={setHoveredId}
              onSelect={setSelectedSkill}
            />
          ) : (
            <div className="flex min-h-[40vh] items-center justify-center rounded-xl border border-border/60 bg-panel/30 text-textMuted">
              No skills match the current filters.
            </div>
          )}
        </FadeIn>

        {/* List view: small screens only */}
        <FadeIn delay={0.1} className="mt-6 md:hidden">
          {clusters.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {clusters.map((skill, index) => (
                <SkillClusterView
                  key={skill.id}
                  skill={skill}
                  index={index}
                  reducedMotion={reducedMotion}
                  onSelect={setSelectedSkill}
                  mode="list"
                />
              ))}
            </div>
          ) : (
            <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-border/60 bg-panel/30 text-textMuted">
              No skills match the current filters.
            </div>
          )}
        </FadeIn>
      </div>

      <SkillDetailPanel
        skill={selectedSkill}
        onClose={() => setSelectedSkill(null)}
        reducedMotion={reducedMotion}
      />
    </AppShell>
  );
}
