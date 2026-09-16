"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  Code2,
  ExternalLink,
  Eye,
  Globe,
  Layers,
  Palette,
  Smartphone,
  Zap,
} from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { easeExpo } from "@/lib/motion";

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
      "SEO basics",
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
    title: "This portfolio",
    description: "Personal site: projects, photography, exploring, contact.",
    href: "/",
    tech: "Next.js · React",
    internal: true,
  },
  {
    title: "Nodexity",
    description: "Minecraft server manager — start, stop, monitor from one place.",
    href: "https://nodexity.com",
    tech: "Node.js · DevOps",
  },
  {
    title: "Here Comes The Bride",
    description: "Wedding dresses and accessories — browse and discover for your big day.",
    href: "https://herecomesthebride2025.com/",
    tech: "Web · E-commerce",
  },
  {
    title: "Asphalt Solutions",
    description: "Sealcoating, crack filling, asphalt repair, and snow plowing in CNY.",
    href: "https://asphaltsolutionscny.com",
    tech: "Vite",
  },
];

export default function WebsitesPage() {
  return (
    <div className="min-h-screen pb-8 pt-28 sm:pt-32">
      <section className="container-page max-w-4xl pb-16 text-center sm:pb-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: easeExpo }}
        >
          <p className="text-[11px] font-medium tracking-[0.24em] text-[var(--accent-light)]">
            WEBSITES
          </p>
          <h1
            className="mt-4 font-semibold tracking-tight text-[var(--text)]"
            style={{ fontSize: "clamp(2.25rem, 5vw, 3.75rem)" }}
          >
            Custom websites, built for you
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-[var(--text-muted)]">
            From a simple one-pager to a full web app — I design and build fast,
            responsive sites that look professional and work on every device.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/40 bg-[var(--accent-soft)] px-5 py-2.5 text-sm font-medium text-[var(--accent-light)] transition-colors hover:border-[var(--accent)]/70"
            >
              Get a quote
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#work"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-2.5 text-sm font-medium text-[var(--text-muted)] transition-colors hover:border-white/20 hover:text-[var(--text)]"
            >
              See previous work
            </a>
            <Link
              href="/websites/payment"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-2.5 text-sm font-medium text-[var(--text-muted)] transition-colors hover:border-white/20 hover:text-[var(--text)]"
            >
              How does payment work?
            </Link>
          </div>
        </motion.div>
      </section>

      <section className="container-page max-w-5xl py-12 sm:py-16">
        <Reveal>
          <h2 className="text-xl font-semibold tracking-tight text-[var(--text)] sm:text-2xl">
            What you get
          </h2>
          <p className="mt-2 max-w-xl text-[var(--text-muted)]">
            Every project is responsive, fast, and built with modern tools so
            it&apos;s easy to update and maintain.
          </p>
        </Reveal>
        <div className="mt-8 grid gap-5 sm:grid-cols-3">
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
            <Reveal key={item.title} delay={0.08 * (i + 1)}>
              <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-[var(--bg3)]/50 p-6 transition-colors hover:border-[var(--accent)]/25">
                <item.icon className="h-8 w-8 text-[var(--accent-light)]" />
                <h3 className="mt-3 font-semibold text-[var(--text)]">{item.title}</h3>
                <p className="mt-1.5 text-sm text-[var(--text-muted)]">{item.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="container-page max-w-5xl py-12 sm:py-16">
        <Reveal>
          <h2 className="text-xl font-semibold tracking-tight text-[var(--text)] sm:text-2xl">
            What I can do, and for how much
          </h2>
          <p className="mt-2 max-w-xl text-[var(--text-muted)]">
            Transparent starting points. Final price depends on scope — we&apos;ll
            figure that out together.
          </p>
        </Reveal>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {tiers.map((tier, i) => (
            <Reveal key={tier.name} delay={0.06 * (i + 1)}>
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ type: "spring", bounce: 0.3 }}
                className={`relative flex h-full flex-col rounded-2xl border p-6 sm:p-7 ${
                  tier.highlight
                    ? "border-[var(--accent)]/40 bg-[var(--accent-soft)]/20"
                    : "border-white/10 bg-[var(--bg3)]/40"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <tier.icon className="h-8 w-8 shrink-0 text-[var(--accent-light)]" />
                    <div>
                      <h3 className="text-lg font-semibold text-[var(--text)]">
                        {tier.name}
                      </h3>
                      <p className="mt-0.5 text-sm text-[var(--text-muted)]">
                        {tier.description}
                      </p>
                    </div>
                  </div>
                  {tier.highlight && (
                    <span className="inline-flex shrink-0 rounded-full border border-[var(--accent)]/30 bg-[var(--accent-soft)] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--accent-light)]">
                      Popular
                    </span>
                  )}
                </div>
                <p className="mt-5 text-lg font-semibold text-[var(--accent-light)]">
                  {tier.price}
                </p>
                <ul className="mt-4 flex-1 space-y-2">
                  {tier.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 text-sm text-[var(--text-muted)]"
                    >
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={tier.exampleUrl}
                  className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-[var(--text)] transition-colors hover:border-[var(--accent)]/40 hover:text-[var(--accent-light)]"
                >
                  <Eye className="h-4 w-4" />
                  View example
                </Link>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="work" className="container-page max-w-5xl py-12 sm:py-16">
        <Reveal>
          <h2 className="text-xl font-semibold tracking-tight text-[var(--text)] sm:text-2xl">
            Previous work
          </h2>
          <p className="mt-2 max-w-xl text-[var(--text-muted)]">
            A few things I&apos;ve built — from side projects to full sites.
          </p>
        </Reveal>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {previousWork.map((project, i) => {
            const card = (
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ type: "spring", bounce: 0.3 }}
                className="flex h-full flex-col rounded-2xl border border-white/10 bg-[var(--bg3)]/40 p-6 transition-colors hover:border-[var(--accent)]/30"
              >
                <div className="flex items-start justify-between gap-2">
                  <Globe className="h-6 w-6 shrink-0 text-[var(--accent-light)]" />
                  <ExternalLink className="h-4 w-4 text-[var(--text-muted)] transition-colors group-hover/card:text-[var(--accent-light)]" />
                </div>
                <h3 className="mt-3 font-semibold text-[var(--text)]">{project.title}</h3>
                <p className="mt-1.5 flex-1 text-sm text-[var(--text-muted)]">
                  {project.description}
                </p>
                <p className="mt-3 text-xs text-[var(--text-muted)]/80">{project.tech}</p>
              </motion.div>
            );

            return (
              <Reveal key={project.title} delay={0.06 * (i + 1)}>
                {project.internal ? (
                  <Link href={project.href} className="group/card block h-full">
                    {card}
                  </Link>
                ) : (
                  <a
                    href={project.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group/card block h-full"
                  >
                    {card}
                  </a>
                )}
              </Reveal>
            );
          })}
        </div>
      </section>

      <section className="container-page max-w-3xl py-16 sm:py-20">
        <Reveal>
          <div className="rounded-2xl border border-white/10 bg-[var(--accent-soft)]/15 px-6 py-10 text-center sm:px-10">
            <h2 className="text-xl font-semibold tracking-tight text-[var(--text)] sm:text-2xl">
              Ready to get started?
            </h2>
            <p className="mt-3 text-[var(--text-muted)]">
              Tell me about your project and what you&apos;re looking for. I&apos;ll
              get back with a rough scope and quote.
            </p>
            <Link
              href="/contact"
              className="mt-6 inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/40 bg-[var(--accent-soft)] px-5 py-2.5 text-sm font-medium text-[var(--accent-light)] transition-colors hover:border-[var(--accent)]/70"
            >
              Get in touch
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
