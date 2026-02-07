import { AppShell } from "@/components/shell/AppShell";
import { PageTransition } from "@/components/motion/PageTransition";
import { FadeIn } from "@/components/motion/FadeIn";
import { Heading } from "@/components/ui/Heading";

export default function LifestylePage() {
  return (
    <AppShell>
      <PageTransition className="mx-auto max-w-6xl px-4 py-12">
        <FadeIn>
          <Heading as="h1">Lifestyle</Heading>
        </FadeIn>
        <FadeIn delay={0.1}>
          <p className="mt-2 text-textMuted">Placeholder section.</p>
        </FadeIn>
      </PageTransition>
    </AppShell>
  );
}
