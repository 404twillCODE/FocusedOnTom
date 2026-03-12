"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Target, Palette, LineChart } from "lucide-react";

const navLinks = [
  { id: "about", label: "About" },
  { id: "services", label: "Services" },
  { id: "work", label: "Work" },
  { id: "contact", label: "Contact" },
];

const services = [
  {
    icon: Target,
    title: "Strategy",
    desc: "Brand positioning, audience research, and go-to-market plans that align with your goals.",
  },
  {
    icon: Palette,
    title: "Design",
    desc: "Identity, visual systems, and digital product design that stands out and converts.",
  },
  {
    icon: LineChart,
    title: "Growth",
    desc: "Websites, landing pages, and campaigns built for clarity and measurable results.",
  },
];

const caseStudies = [
  { name: "FinServe", category: "Finance", result: "40% increase in sign-ups" },
  { name: "Apex Logistics", category: "SaaS", result: "Rebrand + new website" },
  { name: "Greenfield Co", category: "Retail", result: "E-commerce launch" },
];

export default function BusinessTemplatePage() {
  const [email, setEmail] = useState("");
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactError, setContactError] = useState("");

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactError("");
    const trimmed = email.trim();
    if (!trimmed) {
      setContactError("Please enter your email.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setContactError("Please enter a valid email address.");
      return;
    }
    setContactSubmitted(true);
  };

  return (
    <div
      className="min-h-screen font-sans antialiased"
      style={{
        backgroundColor: "#ffffff",
        color: "#0f172a",
      }}
    >
      {/* Nav */}
      <header
        className="sticky top-0 z-50 border-b px-4 py-4 sm:px-8"
        style={{
          backgroundColor: "rgba(255,255,255,0.95)",
          borderColor: "#e2e8f0",
        }}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <a href="#" className="text-lg font-semibold tracking-tight" style={{ color: "#0f172a" }}>
            Meridian
          </a>
          <nav className="flex gap-8">
            {navLinks.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                className="text-sm font-medium transition-colors hover:opacity-70"
                style={{ color: "#475569" }}
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section
          className="px-4 py-20 sm:px-8 sm:py-28"
          style={{ backgroundColor: "#f8fafc" }}
        >
          <div className="mx-auto max-w-3xl text-center">
            <h1
              className="text-4xl font-bold tracking-tight sm:text-5xl"
              style={{ color: "#0f172a" }}
            >
              We help brands grow with strategy, design, and digital products.
            </h1>
            <p className="mt-6 text-lg" style={{ color: "#64748b" }}>
              Meridian is a consulting and design studio. We work with startups and established companies to clarify their message, strengthen their brand, and build websites and products that perform.
            </p>
            <a
              href="#contact"
              className="mt-8 inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-colors hover:opacity-90"
              style={{
                backgroundColor: "#0f172a",
                color: "#ffffff",
              }}
            >
              Start a project
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </section>

        {/* About */}
        <section id="about" className="mx-auto max-w-5xl px-4 py-16 sm:px-8 sm:py-24">
          <h2 className="text-2xl font-semibold" style={{ color: "#0f172a" }}>
            About
          </h2>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed" style={{ color: "#475569" }}>
            We're a small team of strategists, designers, and developers. We don't do everything — we focus on brand strategy, visual identity, and web design and development. That focus lets us deliver work we're proud of and that actually moves the needle for our clients.
          </p>
        </section>

        {/* Services */}
        <section
          id="services"
          className="px-4 py-16 sm:px-8 sm:py-24"
          style={{ backgroundColor: "#f8fafc" }}
        >
          <div className="mx-auto max-w-5xl">
            <h2 className="text-2xl font-semibold" style={{ color: "#0f172a" }}>
              Services
            </h2>
            <div className="mt-10 grid gap-8 sm:grid-cols-3">
              {services.map((item) => (
                <div
                  key={item.title}
                  className="rounded-xl border border-[#e2e8f0] bg-white p-6"
                >
                  <item.icon className="h-7 w-7" style={{ color: "#0f172a" }} />
                  <h3 className="mt-4 font-semibold" style={{ color: "#0f172a" }}>
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: "#64748b" }}>
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Work */}
        <section id="work" className="mx-auto max-w-5xl px-4 py-16 sm:px-8 sm:py-24">
          <h2 className="text-2xl font-semibold" style={{ color: "#0f172a" }}>
            Selected work
          </h2>
          <p className="mt-2" style={{ color: "#64748b" }}>
            A few recent projects and the outcomes we helped achieve.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {caseStudies.map((project) => (
              <div
                key={project.name}
                className="overflow-hidden rounded-xl border border-[#e2e8f0] bg-[#f8fafc] transition-shadow hover:shadow-md"
              >
                <div
                  className="flex aspect-[4/3] items-center justify-center text-4xl font-bold"
                  style={{ color: "#cbd5e1" }}
                >
                  {project.name.slice(0, 1)}
                </div>
                <div className="p-5">
                  <span
                    className="text-xs font-medium uppercase tracking-wider"
                    style={{ color: "#64748b" }}
                  >
                    {project.category}
                  </span>
                  <h3 className="mt-1 font-semibold" style={{ color: "#0f172a" }}>
                    {project.name}
                  </h3>
                  <p className="mt-1 text-sm" style={{ color: "#64748b" }}>
                    {project.result}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Contact */}
        <section
          id="contact"
          className="px-4 py-16 sm:px-8 sm:py-24"
          style={{ backgroundColor: "#0f172a", color: "#f8fafc" }}
        >
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-semibold">Let's talk</h2>
            <p className="mt-4 opacity-90">
              Have a project in mind? Tell us a bit about it and we'll get back with next steps.
            </p>
            {contactSubmitted ? (
              <div className="mt-8 rounded-lg border border-[#334155] bg-white/5 px-6 py-8">
                <p className="font-medium">Thanks for reaching out!</p>
                <p className="mt-2 text-sm opacity-90">
                  We've received your email and will get back to you within 1–2 business days.
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleContactSubmit}
                className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center"
              >
                <div className="flex flex-1 flex-col gap-1">
                  <input
                    type="email"
                    placeholder="Your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="rounded-lg border border-[#334155] bg-transparent px-4 py-2.5 text-sm placeholder:opacity-60 focus:border-[#64748b] focus:outline-none"
                  />
                  {contactError && (
                    <p className="text-left text-xs text-red-300">{contactError}</p>
                  )}
                </div>
                <button
                  type="submit"
                  className="rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-[#0f172a] transition-opacity hover:opacity-90"
                >
                  Get in touch
                </button>
              </form>
            )}
          </div>
        </section>
      </main>

      <footer
        className="border-t px-4 py-8"
        style={{ borderColor: "#e2e8f0", backgroundColor: "#f8fafc" }}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <p className="text-sm" style={{ color: "#64748b" }}>
            © Meridian. All rights reserved.
          </p>
          <Link
            href="/websites"
            className="text-xs underline opacity-70 hover:opacity-100"
            style={{ color: "#64748b" }}
          >
            Template demo
          </Link>
        </div>
      </footer>
    </div>
  );
}
