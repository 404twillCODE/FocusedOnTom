import { AppShell } from "@/components/shell/AppShell";
import { PageTransition } from "@/components/motion/PageTransition";
import { FadeIn } from "@/components/motion/FadeIn";
import { getExperiments } from "@/lib/data/experiments";
import { GlassPanel } from "@/components/shell/GlassPanel";
import { Heading } from "@/components/ui/Heading";
import { Tag } from "@/components/ui/Tag";

export default function LabPage() {
  const experiments = getExperiments();

  return (
    <AppShell>
      <PageTransition className="mx-auto max-w-6xl px-4 py-12">
        <FadeIn>
          <Heading as="h1">Lab</Heading>
        </FadeIn>
        <FadeIn delay={0.1}>
          <p className="mt-2 text-textMuted">Experiments and experiments.</p>
        </FadeIn>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {experiments.map((exp, i) => (
            <FadeIn key={exp.id} delay={0.15 + i * 0.05}>
              <GlassPanel variant="panel" glow="none" className="p-4">
                <h2 className="font-semibold text-text">{exp.title}</h2>
                <p className="mt-1 text-sm text-textMuted">{exp.description}</p>
                {exp.tags?.length ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {exp.tags.map((tag) => (
                      <Tag key={tag}>{tag}</Tag>
                    ))}
                  </div>
                ) : null}
              </GlassPanel>
            </FadeIn>
          ))}
        </ul>
      </PageTransition>
    </AppShell>
  );
}
