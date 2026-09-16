"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle,
  Github,
  Instagram,
  Linkedin,
  Mail,
  X,
} from "lucide-react";

const FORMSPREE_ENDPOINT =
  process.env.NEXT_PUBLIC_FORMSPREE_ENDPOINT || "https://formspree.io/f/mdaladkg";

const CONTACT_LINKS = {
  instagram: "https://www.instagram.com/thomasw_300/",
  github: "https://github.com/404twillCODE",
  linkedin: "https://www.linkedin.com/in/thomas-williams-a32130350/",
} as const;

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

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
    description: "Best for business, partnerships, or longer messages.",
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
    description: "Professional background + connections.",
    cta: "Connect on LinkedIn",
    external: true,
    isEmail: false,
  },
];

const headlineTransition = { duration: 1.2, ease: [0.22, 1, 0.36, 1] as const };
const cardsDelay = 1.6;

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
        className="group flex h-full min-h-[260px] w-full max-w-[300px] flex-col items-center rounded-2xl border border-white/10 bg-[var(--bg3)]/80 p-6 text-center transition-colors hover:border-[var(--accent)]/35 hover:bg-[var(--accent-soft)]/30 sm:min-h-[300px] sm:p-8"
      >
        <motion.span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent-light)] transition-colors group-hover:bg-[var(--accent)]/25"
          whileHover={{ scale: 1.08 }}
          transition={{ type: "spring", bounce: 0.4 }}
        >
          <Icon className="h-6 w-6" />
        </motion.span>
        <h2 className="mt-4 text-lg font-semibold text-[var(--text)]">{option.title}</h2>
        <p className="mt-2 flex-1 text-[15px] leading-relaxed text-[var(--text-muted)]">
          {option.description}
        </p>
        <p className="mt-4 flex shrink-0 items-center justify-center gap-2 text-sm font-medium text-[var(--accent-light)] group-hover:underline">
          {option.cta}
          <ArrowRight className="h-4 w-4" />
        </p>
      </motion.div>
    </motion.div>
  );

  if (option.isEmail && onEmailClick) {
    return (
      <button
        type="button"
        onClick={onEmailClick}
        className="block w-full text-left"
        aria-label={`${option.title}: ${option.description}`}
      >
        {content}
      </button>
    );
  }

  return (
    <a
      href={option.href}
      target="_blank"
      rel="noopener noreferrer"
      className="block w-full"
      aria-label={`${option.cta} (opens in new tab)`}
    >
      {content}
    </a>
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
    if (emailModalOpen) {
      setName("");
      setEmail("");
      setMessage("");
      setCompany("");
      setErrors({});
      setSubmitStatus("idle");
    }
  }, [emailModalOpen]);

  function validate(): boolean {
    const next: typeof errors = {};
    if (!name.trim()) next.name = "Required";
    if (!email.trim()) next.email = "Required";
    else if (!isValidEmail(email)) next.email = "Please enter a valid email";
    if (!message.trim()) next.message = "Required";
    else if (message.trim().length < 5) next.message = "At least 5 characters";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    if (company.trim()) {
      setSubmitStatus("success");
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
        }),
      });
      const data = (await res.json()) as { ok?: boolean };
      if (data.ok !== false && res.ok) {
        setSubmitStatus("success");
        setTimeout(() => setEmailModalOpen(false), 2400);
      } else {
        setSubmitStatus("error");
      }
    } catch {
      setSubmitStatus("error");
    }
  }

  return (
    <main className="min-h-screen pb-20 pt-20 sm:pt-24">
      <AnimatePresence>
        {emailModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 p-4 backdrop-blur-md"
            onClick={() => setEmailModalOpen(false)}
            aria-modal
            role="dialog"
            aria-label="Contact form"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[var(--bg3)] p-6 shadow-xl sm:p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setEmailModalOpen(false)}
                className="absolute right-4 top-4 rounded-lg p-1.5 text-[var(--text-muted)] transition-colors hover:bg-white/10 hover:text-[var(--text)]"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
              <h2 className="pr-10 text-xl font-semibold text-[var(--text)]">
                {submitStatus === "success" ? "Email sent" : "Send me an email"}
              </h2>
              {submitStatus === "success" ? (
                <div className="mt-6 flex flex-col items-center gap-3 text-center">
                  <CheckCircle className="h-12 w-12 text-[var(--accent)]" aria-hidden />
                  <p className="text-lg font-medium text-[var(--text)]">Email sent</p>
                  <p className="text-sm text-[var(--text-muted)]">I&apos;ll get back to you soon.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
                  <Field
                    id="name"
                    label="Name"
                    value={name}
                    onChange={setName}
                    error={errors.name}
                    placeholder="Your name"
                  />
                  <Field
                    id="email"
                    label="Your email"
                    type="email"
                    value={email}
                    onChange={setEmail}
                    error={errors.email}
                    placeholder="you@example.com"
                  />
                  <div>
                    <label
                      htmlFor="message"
                      className="mb-1.5 block text-sm font-medium text-[var(--text-muted)]"
                    >
                      Message
                    </label>
                    <textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={4}
                      placeholder="What's on your mind?"
                      className="w-full rounded-lg border border-white/10 bg-[var(--bg2)] px-3 py-2 text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--accent)]/50"
                    />
                    {errors.message && (
                      <p className="mt-1 text-sm text-[var(--text-muted)]" role="alert">
                        {errors.message}
                      </p>
                    )}
                  </div>
                  <div className="sr-only" aria-hidden>
                    <label htmlFor="company">Company</label>
                    <input
                      id="company"
                      tabIndex={-1}
                      autoComplete="off"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                    />
                  </div>
                  {submitStatus === "error" && (
                    <p className="text-sm text-[var(--text-muted)]" role="alert">
                      Couldn&apos;t send right now. Please try again.
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={submitStatus === "sending"}
                      className="rounded-xl bg-[var(--accent-soft)] px-5 py-3 text-sm font-medium text-[var(--accent-light)] transition-colors hover:bg-[var(--accent)]/25 disabled:opacity-60"
                    >
                      {submitStatus === "sending" ? "Sending…" : "Send"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEmailModalOpen(false)}
                      className="rounded-xl border border-white/10 px-5 py-3 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)]"
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

      <section className="relative mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-12 md:px-8">
        <div className="relative min-h-[70vh]">
          <div
            className="relative z-10 grid min-h-[70vh] grid-cols-1 gap-6 md:grid-cols-3 md:grid-rows-3 md:gap-6 md:items-stretch"
            style={{ gridTemplateRows: undefined }}
          >
            {/* Mobile stacked fallback */}
            <div className="space-y-8 md:contents">
              <div className="md:col-start-1 md:row-start-1 md:self-end md:pr-4">
                <motion.span
                  initial={{ opacity: 0, x: "-100vw" }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ ...headlineTransition, delay: 0 }}
                  className="block text-4xl font-bold tracking-tight text-[var(--text)] sm:text-5xl md:text-6xl lg:text-7xl"
                  style={{ letterSpacing: "-0.02em" }}
                >
                  Let&apos;s
                </motion.span>
              </div>

              <div className="hidden md:col-start-2 md:row-start-1 md:flex md:h-full md:justify-center">
                <ContactCard
                  option={contactOptions[0]}
                  position="top"
                  onEmailClick={() => setEmailModalOpen(true)}
                />
              </div>

              <div className="hidden md:col-start-1 md:row-start-2 md:flex md:h-full md:justify-end">
                <ContactCard
                  option={contactOptions[1]}
                  position="left"
                  onEmailClick={() => setEmailModalOpen(true)}
                />
              </div>

              <div className="md:col-start-2 md:row-start-2 md:flex md:items-center md:justify-center">
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ ...headlineTransition, delay: 0.6 }}
                  className="block text-4xl font-bold tracking-tight text-[var(--text)] sm:text-5xl md:text-6xl lg:text-7xl"
                  style={{ letterSpacing: "-0.02em" }}
                >
                  Work
                </motion.span>
              </div>

              <div className="hidden md:col-start-3 md:row-start-2 md:flex md:h-full md:justify-start">
                <ContactCard
                  option={contactOptions[2]}
                  position="right"
                  onEmailClick={() => setEmailModalOpen(true)}
                />
              </div>

              <div className="hidden md:col-start-2 md:row-start-3 md:flex md:h-full md:justify-center">
                <ContactCard
                  option={contactOptions[3]}
                  position="bottom"
                  onEmailClick={() => setEmailModalOpen(true)}
                />
              </div>

              <div className="md:col-start-3 md:row-start-3 md:self-start md:pl-4">
                <motion.span
                  initial={{ opacity: 0, x: "100vw" }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ ...headlineTransition, delay: 0.8 }}
                  className="block text-4xl font-bold tracking-tight text-[var(--text)] sm:text-right sm:text-5xl md:text-6xl lg:text-7xl"
                  style={{ letterSpacing: "-0.02em" }}
                >
                  Together
                </motion.span>
              </div>

              {/* Mobile cards */}
              <div className="grid gap-4 sm:grid-cols-2 md:hidden">
                {contactOptions.map((option, i) => (
                  <ContactCard
                    key={option.title}
                    option={option}
                    position={(["top", "left", "right", "bottom"] as const)[i]}
                    onEmailClick={() => setEmailModalOpen(true)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  error,
  placeholder,
  type = "text",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  placeholder: string;
  type?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-[var(--text-muted)]">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-white/10 bg-[var(--bg2)] px-3 py-2 text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--accent)]/50"
        aria-invalid={!!error}
      />
      {error && (
        <p className="mt-1 text-sm text-[var(--text-muted)]" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
