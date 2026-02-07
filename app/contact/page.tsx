import { AppShell } from "@/components/shell/AppShell";
import { PageTransition } from "@/components/motion/PageTransition";
import { FadeIn } from "@/components/motion/FadeIn";
import { Heading } from "@/components/ui/Heading";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ContactPage() {
  return (
    <AppShell>
      <PageTransition className="mx-auto max-w-6xl px-4 py-12">
        <FadeIn>
          <Heading as="h1">Contact</Heading>
        </FadeIn>
        <FadeIn delay={0.1}>
          <p className="mt-2 text-textMuted">Get in touch.</p>
        </FadeIn>
        <FadeIn delay={0.2}>
          <form className="mt-8 flex max-w-md flex-col gap-4">
            <Input type="email" placeholder="Email" aria-label="Email" className="border-border bg-panel-solid text-text" />
            <Input type="text" placeholder="Subject" aria-label="Subject" className="border-border bg-panel-solid text-text" />
            <Button type="submit" className="bg-mint text-bg hover:bg-mint/90">Send (placeholder)</Button>
          </form>
        </FadeIn>
      </PageTransition>
    </AppShell>
  );
}
