"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Linkedin, Github, Instagram, ArrowRight, X, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";

// Single source for Formspree; override via NEXT_PUBLIC_FORMSPREE_ENDPOINT on Vercel (see CONTACT_FORM.md).
const FORMSPREE_ENDPOINT =
  process.env.NEXT_PUBLIC_FORMSPREE_ENDPOINT || "https://formspree.io/f/mdaladkg";

const CONTACT_LINKS = {
  instagram: "https://instagram.com/thomasw_300",
  github: "https://github.com/404twillCODE",
  linkedin: "https://www.linkedin.com/in/thomas-williams-a32130350/",
} as const;

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

// Order reflects priority: Instagram (primary), Email (secondary), GitHub (credibility), LinkedIn (optional)
const contactOptions = [
  {
    href: CONTACT_LINKS.instagram,
    icon: Instagram,
    title: "Instagram",
    description: "Fastest way to reach me. I usually reply to DMs the quickest.",
    cta: "Message me on Instagram",
    external: true,
    isEmail: false,
  },
  {
    href: "",
    icon: Mail,
    title: "Email",
    description: "Best for business, partnerships, or longer messages. Replies may take a bit.",
    cta: "Send an email",
    external: false,
    isEmail: true,
  },
  {
    href: CONTACT_LINKS.github,
    icon: Github,
    title: "GitHub",
    description: "Code, side projects, and what I'm building.",
    cta: "View GitHub",
    external: true,
    isEmail: false,
  },
  {
    href: CONTACT_LINKS.linkedin,
    icon: Linkedin,
    title: "LinkedIn",
    description: "Professional background + connections. I check this less often.",
    cta: "Connect on LinkedIn",
    external: true,
    isEmail: false,
  },
];

const headlineTransition = { duration: 1.2, ease: [0.22, 1, 0.36, 1] as const };
const cardsDelay = 1.6; // cards come in soon after Together starts

function ContactCard({
  option,
  position,
  onEmailClick,
}: {
  option: (typeof contactOptions)[0];
  position: "top" | "left" | "right" | "bottom";
  onEmailClick?: () => void;
}) {
  const Icon = option.icon;
  const initial =
    position === "top"
      ? { opacity: 0, y: "-80px", x: 0 }
      : position === "bottom"
        ? { opacity: 0, y: "80px", x: 0 }
        : position === "left"
          ? { opacity: 0, x: "-80px", y: 0 }
          : { opacity: 0, x: "80px", y: 0 };

  const content = (
    <motion.div
      initial={initial}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ ...headlineTransition, delay: cardsDelay }}
      className="flex h-full w-full justify-center"
    >
      <motion.div
        whileHover={{ y: -6 }}
        transition={{ type: "spring", bounce: 0.35 }}
        className="group flex h-full min-h-[280px] w-[280px] flex-col items-center rounded-2xl border border-[var(--border)] bg-[var(--bg2)]/50 p-6 text-center transition-colors hover:border-[var(--ice)]/25 hover:bg-[var(--iceSoft)]/20 sm:p-8 sm:min-h-[300px] sm:w-[300px]"
      >
        <motion.span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--iceSoft)] text-[var(--ice)] transition-colors group-hover:bg-[var(--ice)]/25"
          whileHover={{ scale: 1.08 }}
          transition={{ type: "spring", bounce: 0.4 }}
        >
          <Icon className="h-6 w-6" />
        </motion.span>
        <h2 className="mt-4 text-lg font-semibold text-[var(--text)]">
          {option.title}
        </h2>
        <p className="mt-2 flex-1 text-[15px] text-[var(--textMuted)] leading-relaxed">
          {option.description}
        </p>
        <p className="mt-4 flex shrink-0 items-center justify-center gap-2 text-sm font-medium text-[var(--ice)] group-hover:underline">
          {option.cta}
          <ArrowRight className="h-4 w-4" />
        </p>
      </motion.div>
    </motion.div>
  );

  const cardLabel = `${option.title}: ${option.description}`;
  if (option.isEmail && onEmailClick) {
    return (
      <button
        type="button"
        onClick={onEmailClick}
        className="block w-full text-left"
        aria-label={cardLabel}
      >
        {content}
      </button>
    );
  }
  return option.external ? (
    <a
      href={option.href}
      target="_blank"
      rel="noopener noreferrer"
      className="block w-full"
      aria-label={`${option.cta} (opens in new tab)`}
    >
      {content}
    </a>
  ) : (
    <Link href={option.href} className="block w-full">
      {content}
    </Link>
  );
}

type SubmitStatus = "idle" | "sending" | "success" | "error";

export default function ContactPage() {
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [company, setCompany] = useState("");
  const [errors, setErrors] = useState<{ name?: string; email?: string; message?: string }>({});
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (emailModalOpen) resetForm();
  }, [emailModalOpen]);

  function resetForm() {
    setName("");
    setEmail("");
    setMessage("");
    setCompany("");
    setErrors({});
    setSubmitStatus("idle");
  }

  function validate(): boolean {
    const next: typeof errors = {};
    const tName = name.trim();
    const tEmail = email.trim();
    const tMessage = message.trim();
    if (!tName) next.name = "Required";
    if (!tEmail) next.email = "Required";
    else if (!isValidEmail(tEmail)) next.email = "Please enter a valid email";
    if (!tMessage) next.message = "Required";
    else if (tMessage.length < 5) next.message = "At least 5 characters";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    if (company.trim()) {
      setSubmitStatus("success");
      setName("");
      setEmail("");
      setMessage("");
      setCompany("");
      setErrors({});
      setTimeout(() => setEmailModalOpen(false), 2400);
      return;
    }

    setSubmitStatus("sending");
    try {
      const res = await fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          message: message.trim(),
          source: "focusedontom.com",
          subject: `FocusedOnTom contact — ${name.trim()}`,
          company: company.trim(),
        }),
      });
      const data = (await res.json()) as { ok?: boolean };
      if (data.ok !== false && res.ok) {
        setSubmitStatus("success");
        setName("");
        setEmail("");
        setMessage("");
        setCompany("");
        setErrors({});
        setTimeout(() => setEmailModalOpen(false), 2400);
      } else {
        if (process.env.NODE_ENV === "development") {
          console.debug("[Contact form] Submit failed:", res.status, data);
        }
        setSubmitStatus("error");
      }
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.debug("[Contact form] Submit error:", err);
      }
      setSubmitStatus("error");
    }
  }

  return (
    <main className="min-h-screen">
      {/* Email modal — blurred background, form in center */}
      <AnimatePresence>
        {emailModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 p-4 backdrop-blur-md"
            onClick={() => setEmailModalOpen(false)}
            aria-modal
            role="dialog"
            aria-label="Contact form"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--bg2)] p-6 shadow-xl sm:p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setEmailModalOpen(false)}
                className="absolute right-4 top-4 rounded-lg p-1.5 text-[var(--textMuted)] transition-colors hover:bg-white/10 hover:text-[var(--text)]"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
              <h2 className="pr-10 text-xl font-semibold text-[var(--text)]">
                {submitStatus === "success" ? "Email sent" : "Send me an email"}
              </h2>
              {submitStatus !== "success" && (
                <>
                  <p className="mt-1 text-sm text-[var(--textMuted)]">
                    Fill this out and I'll get it in my inbox.
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--textMuted)]/80">Replies may take 1–2 days.</p>
                </>
              )}
              {submitStatus === "success" ? (
                <div className="mt-6 flex flex-col items-center gap-3 text-center">
                  <CheckCircle className="h-12 w-12 text-[var(--ice)]" aria-hidden />
                  <p className="text-lg font-medium text-[var(--text)]">Email sent</p>
                  <p className="text-sm text-[var(--textMuted)]">I'll get back to you soon.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
                  <div>
                    <label htmlFor="modal-contact-name" className="mb-1.5 block text-sm font-medium text-[var(--textMuted)]">
                      Name
                    </label>
                    <Input
                      id="modal-contact-name"
                      type="text"
                      name="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="w-full"
                      aria-invalid={!!errors.name}
                      aria-describedby={errors.name ? "modal-name-error" : undefined}
                    />
                    {errors.name && (
                      <p id="modal-name-error" className="mt-1 text-sm text-[var(--textMuted)]" role="alert">
                        {errors.name}
                      </p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="modal-contact-email" className="mb-1.5 block text-sm font-medium text-[var(--textMuted)]">
                      Your email
                    </label>
                    <Input
                      id="modal-contact-email"
                      type="email"
                      name="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full"
                      aria-invalid={!!errors.email}
                      aria-describedby={errors.email ? "modal-email-error" : undefined}
                    />
                    {errors.email && (
                      <p id="modal-email-error" className="mt-1 text-sm text-[var(--textMuted)]" role="alert">
                        {errors.email}
                      </p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="modal-contact-message" className="mb-1.5 block text-sm font-medium text-[var(--textMuted)]">
                      Message
                    </label>
                    <textarea
                      id="modal-contact-message"
                      name="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={4}
                      placeholder="What's on your mind?"
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg2)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--ice)]/50 placeholder:text-[var(--textMuted)]"
                      aria-invalid={!!errors.message}
                      aria-describedby={errors.message ? "modal-message-error" : undefined}
                    />
                    {errors.message && (
                      <p id="modal-message-error" className="mt-1 text-sm text-[var(--textMuted)]" role="alert">
                        {errors.message}
                      </p>
                    )}
                  </div>
                  <div className="sr-only" aria-hidden="true">
                    <label htmlFor="modal-contact-company">Company</label>
                    <input
                      id="modal-contact-company"
                      type="text"
                      name="company"
                      tabIndex={-1}
                      autoComplete="off"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                    />
                  </div>
                  {submitStatus === "error" && (
                    <p className="text-sm text-[var(--textMuted)]" role="alert">
                      Couldn't send right now. Please try again.
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={submitStatus === "sending"}
                      className="rounded-xl bg-[var(--iceSoft)] px-5 py-3 text-sm font-medium text-[var(--ice)] transition-colors hover:bg-[var(--ice)]/25 disabled:opacity-60 disabled:pointer-events-none"
                    >
                      {submitStatus === "sending" ? "Sending…" : "Send"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEmailModalOpen(false)}
                      className="rounded-xl border border-[var(--border)] px-5 py-3 text-sm font-medium text-[var(--textMuted)] transition-colors hover:text-[var(--text)]"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Diagonal: Lets (top-left) → Work (center) → Together (bottom-right); 4 cards around Work */}
      <section className="relative mx-auto w-full max-w-5xl px-4 py-10 pb-24 sm:px-6 sm:py-12 sm:pb-28 md:px-8">
        <div className="relative min-h-[70vh]">
          <div className="relative z-10 grid grid-cols-3 grid-rows-3 gap-4 sm:gap-6 items-stretch min-h-[70vh]" style={{ gridTemplateRows: "1fr 1fr 1fr" }}>
          {/* Top-left: Lets */}
          <div className="col-start-1 row-start-1 self-end pr-4 overflow-visible">
            <motion.span
              initial={{ opacity: 0, x: "-100vw" }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...headlineTransition, delay: 0 }}
              className="block text-4xl font-bold leading-[1.15] tracking-tight text-[var(--text)] sm:text-5xl md:text-6xl lg:text-7xl"
              style={{ letterSpacing: "-0.02em" }}
            >
              Let's
            </motion.span>
          </div>

          {/* Above Work */}
          <div className="col-start-2 row-start-1 flex h-full justify-center">
            <ContactCard option={contactOptions[0]} position="top" onEmailClick={() => setEmailModalOpen(true)} />
          </div>
          <div className="col-start-3 row-start-1" />

          {/* Left of Work */}
          <div className="col-start-1 row-start-2 flex h-full justify-end">
            <ContactCard option={contactOptions[1]} position="left" onEmailClick={() => setEmailModalOpen(true)} />
          </div>
          {/* Center: Work */}
          <div className="col-start-2 row-start-2 flex items-center justify-center overflow-visible">
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ ...headlineTransition, delay: 0.6 }}
              className="block text-4xl font-bold leading-[1.15] tracking-tight text-[var(--text)] sm:text-5xl md:text-6xl lg:text-7xl"
              style={{ letterSpacing: "-0.02em" }}
            >
              Work
            </motion.span>
          </div>
          {/* Right of Work */}
          <div className="col-start-3 row-start-2 flex h-full justify-start">
            <ContactCard option={contactOptions[2]} position="right" onEmailClick={() => setEmailModalOpen(true)} />
          </div>

          <div className="col-start-1 row-start-3" />
          {/* Below Work */}
          <div className="col-start-2 row-start-3 flex h-full justify-center">
            <ContactCard option={contactOptions[3]} position="bottom" onEmailClick={() => setEmailModalOpen(true)} />
          </div>
          {/* Bottom-right: Together */}
          <div className="col-start-3 row-start-3 self-start pl-4 overflow-visible">
            <motion.span
              initial={{ opacity: 0, x: "100vw" }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...headlineTransition, delay: 0.8 }}
              className="block text-right text-4xl font-bold leading-[1.15] tracking-tight text-[var(--text)] sm:text-5xl md:text-6xl lg:text-7xl"
              style={{ letterSpacing: "-0.02em" }}
            >
              Together
            </motion.span>
          </div>
        </div>
        </div>
      </section>

    </main>
  );
}
