"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import {
  Globe,
  Zap,
  Layers,
  ArrowRight,
  Check,
  ExternalLink,
  Code2,
  Smartphone,
  Palette,
  Eye,
} from "lucide-react";

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

function AnimatedSection({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={fadeInUp}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const tiers = [
  {
    name: "Starter",
    description: "A clean, fast site to get you online.",
    price: "From $350",
    icon: Zap,
    exampleUrl: "/websites/starter",
    features: [
      "Single-page or small multi-page site",
      "Mobile-responsive design",
      "Contact form or basic interactivity",
      "Hosting guidance",
    ],
    highlight: false,
  },
  {
    name: "Business",
    description: "More pages, branding, and room to grow.",
    price: "From $500",
    icon: Layers,
    exampleUrl: "/websites/business",
    features: [
      "Multiple pages & navigation",
      "Custom design to match your brand",
      "Blog or portfolio section",
      "SEO basics & analytics setup",
    ],
    highlight: true,
  },
  {
    name: "Custom",
    description: "Web apps, dashboards, or something unique.",
    price: "Free Quote",
    icon: Code2,
    exampleUrl: "/websites/custom",
    features: [
      "Full web application or dashboard",
      "User accounts, APIs, integrations",
      "Ongoing support options",
      "Built to your exact specs",
    ],
    highlight: false,
  },
];

const previousWork = [
  {
    title: "Nodexity",
    description: "Minecraft server manager — start, stop, monitor from one place.",
    href: "https://nodexity.com",
    tech: "Node.js · DevOps",
  },
  {
    title: "This portfolio",
    description: "Personal site: dev, photography, websites, contact.",
    href: "/",
    tech: "Next.js · React",
    internal: true,
  },
  {
    title: "Here Comes The Bride",
    description: "Wedding dresses and accessories — browse and discover for your big day.",
    href: "https://herecomesthebride2025.com/",
    tech: "Web · E-commerce",
  },
  {
    title: "More coming soon",
    description: "Client and side project sites as they go live.",
    href: "#",
    tech: "—",
    placeholder: true,
  },
];

export default function WebsitesPage() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="mx-auto max-w-4xl px-4 pt-24 pb-16 sm:px-6 sm:pt-28 sm:pb-20">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="text-center"
        >
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--text)] sm:text-4xl md:text-5xl">
            Custom websites, built for you
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-[var(--textMuted)] sm:mt-6">
            From a simple one-pager to a full web app — I design and build fast,
            responsive sites that look professional and work on every device.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--ice)]/50 bg-[var(--iceSoft)]/30 px-5 py-2.5 text-sm font-medium text-[var(--ice)] transition-colors hover:border-[var(--ice)]/70 hover:bg-[var(--iceSoft)]/50"
            >
              Get a quote
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#work"
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg3)]/60 px-5 py-2.5 text-sm font-medium text-[var(--textMuted)] transition-colors hover:border-[var(--ice)]/30 hover:text-[var(--text)]"
            >
              See previous work
            </a>
            <Link
              href="/websites/payment"
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg3)]/60 px-5 py-2.5 text-sm font-medium text-[var(--textMuted)] transition-colors hover:border-[var(--ice)]/30 hover:text-[var(--text)]"
            >
              How does payment work?
            </Link>
          </div>
        </motion.div>
      </section>

      {/* What you get */}
      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
        <AnimatedSection>
          <h2 className="text-xl font-semibold tracking-tight text-[var(--text)] sm:text-2xl">
            What you get
          </h2>
          <p className="mt-2 max-w-xl text-[var(--textMuted)]">
            Every project is responsive, fast, and built with modern tools so it’s
            easy to update and maintain.
          </p>
        </AnimatedSection>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {[
            {
              icon: Smartphone,
              title: "Mobile-first",
              text: "Sites that look and work great on phones, tablets, and desktops.",
            },
            {
              icon: Palette,
              title: "On-brand",
              text: "Design that matches your style and fits your audience.",
            },
            {
              icon: Zap,
              title: "Fast & reliable",
              text: "Clean code and sensible hosting so your site loads quickly.",
            },
          ].map((item, i) => (
            <AnimatedSection key={item.title} delay={0.08 * (i + 1)}>
              <div className="flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--bg2)]/30 p-6 transition-colors hover:border-[var(--ice)]/20">
                <item.icon className="h-8 w-8 text-[var(--ice)]" />
                <h3 className="mt-3 font-semibold text-[var(--text)]">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-sm text-[var(--textMuted)]">
                  {item.text}
                </p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* Pricing scale */}
      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
        <AnimatedSection>
          <h2 className="text-xl font-semibold tracking-tight text-[var(--text)] sm:text-2xl">
            What I can do, and for how much
          </h2>
          <p className="mt-2 max-w-xl text-[var(--textMuted)]">
            Transparent starting points. Final price depends on scope — we’ll
            figure that out together.
          </p>
        </AnimatedSection>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {tiers.map((tier, i) => (
            <AnimatedSection key={tier.name} delay={0.06 * (i + 1)}>
              <motion.div
                className={`relative flex h-full flex-col rounded-2xl border p-6 sm:p-7 ${
                  tier.highlight
                    ? "border-[var(--ice)]/40 bg-[var(--iceSoft)]/10"
                    : "border-[var(--border)] bg-[var(--bg2)]/30"
                }`}
                whileHover={{ y: -2 }}
                transition={{ type: "spring", bounce: 0.35 }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <tier.icon className="h-8 w-8 shrink-0 text-[var(--ice)]" />
                    <div>
                      <h3 className="text-lg font-semibold text-[var(--text)]">
                        {tier.name}
                      </h3>
                      <p className="mt-0.5 text-sm text-[var(--textMuted)]">
                        {tier.description}
                      </p>
                    </div>
                  </div>
                  {tier.highlight && (
                    <span className="inline-flex shrink-0 rounded-lg border border-[var(--ice)]/25 bg-[var(--iceSoft)]/20 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--ice)]">
                      Popular
                    </span>
                  )}
                </div>
                <p className="mt-5 text-lg font-semibold text-[var(--ice)]">
                  {tier.price}
                </p>
                <ul className="mt-4 flex-1 space-y-2">
                  {tier.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 text-sm text-[var(--textMuted)]"
                    >
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--ice)]" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={tier.exampleUrl}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg3)]/60 px-4 py-2.5 text-sm font-medium text-[var(--text)] transition-colors hover:border-[var(--ice)]/40 hover:text-[var(--ice)]"
                >
                  <Eye className="h-4 w-4" />
                  View example
                </Link>
              </motion.div>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* Previous work */}
      <section id="work" className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
        <AnimatedSection>
          <h2 className="text-xl font-semibold tracking-tight text-[var(--text)] sm:text-2xl">
            Previous work
          </h2>
          <p className="mt-2 max-w-xl text-[var(--textMuted)]">
            A few things I’ve built — from side projects to full sites.
          </p>
        </AnimatedSection>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {previousWork.map((project, i) => {
            const hasLink = !project.placeholder && project.href !== "#";
            const cardContent = (
              <motion.div
                className="flex h-full flex-col rounded-2xl border border-[var(--border)] bg-[var(--bg2)]/30 p-6 transition-colors hover:border-[var(--ice)]/25"
                whileHover={{ y: -2 }}
                transition={{ type: "spring", bounce: 0.35 }}
              >
                <div className="flex items-start justify-between gap-2">
                  <Globe className="h-6 w-6 shrink-0 text-[var(--ice)]" />
                  {hasLink && (
                    <span
                      className="rounded-lg p-1 text-[var(--textMuted)] transition-colors group-hover/card:bg-[var(--iceSoft)]/20 group-hover/card:text-[var(--ice)]"
                      aria-hidden
                    >
                      <ExternalLink className="h-4 w-4" />
                    </span>
                  )}
                </div>
                <h3 className="mt-3 font-semibold text-[var(--text)]">
                  {project.title}
                </h3>
                <p className="mt-1.5 flex-1 text-sm text-[var(--textMuted)]">
                  {project.description}
                </p>
                <p className="mt-3 text-xs text-[var(--textMuted)]/80">
                  {project.tech}
                </p>
              </motion.div>
            );
            return (
              <AnimatedSection key={project.title} delay={0.06 * (i + 1)}>
                {hasLink ? (
                  project.internal ? (
                    <Link
                      href={project.href}
                      className="group/card block h-full"
                      aria-label={`Visit ${project.title}`}
                    >
                      {cardContent}
                    </Link>
                  ) : (
                    <a
                      href={project.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group/card block h-full"
                      aria-label={`Visit ${project.title}`}
                    >
                      {cardContent}
                    </a>
                  )
                ) : (
                  cardContent
                )}
              </AnimatedSection>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
        <AnimatedSection>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--iceSoft)]/10 p-8 text-center sm:p-10">
            <h2 className="text-xl font-semibold tracking-tight text-[var(--text)] sm:text-2xl">
              Ready to get started?
            </h2>
            <p className="mt-3 text-[var(--textMuted)]">
              Tell me about your project and what you’re looking for. I’ll get back
              with a rough scope and quote.
            </p>
            <Link
              href="/contact"
              className="mt-6 inline-flex items-center gap-2 rounded-xl border border-[var(--ice)]/50 bg-[var(--iceSoft)]/30 px-5 py-2.5 text-sm font-medium text-[var(--ice)] transition-colors hover:border-[var(--ice)]/70 hover:bg-[var(--iceSoft)]/50"
            >
              Get in touch
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </AnimatedSection>
      </section>
    </main>
  );
}
