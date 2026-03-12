"use client";

import { useState } from "react";
import Link from "next/link";
import { Phone, Mail, MapPin, Coffee, Cake, PartyPopper, X, Check } from "lucide-react";

export default function StarterTemplatePage() {
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    date: "",
    details: "",
  });

  const handleQuoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) return;
    setSubmitted(true);
    setTimeout(() => {
      setQuoteOpen(false);
      setSubmitted(false);
      setFormData({ name: "", email: "", date: "", details: "" });
    }, 2000);
  };

  return (
    <div
      className="min-h-screen font-serif antialiased"
      style={{
        backgroundColor: "#faf6f0",
        color: "#3d3429",
      }}
    >
      {/* Top bar */}
      <header
        className="border-b px-4 py-4 sm:px-8"
        style={{ borderColor: "#e8e0d5", backgroundColor: "#fffefb" }}
      >
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <span
            className="text-xl font-semibold tracking-tight"
            style={{ color: "#8b6914" }}
          >
            Hearth & Flour
          </span>
          <button
            type="button"
            onClick={() => setQuoteOpen(true)}
            className="rounded-full px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90"
            style={{
              backgroundColor: "#8b6914",
              color: "#fffefb",
            }}
          >
            Order
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-8 sm:py-16">
        {/* Hero */}
        <section className="text-center">
          <h1
            className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl"
            style={{ color: "#2c2419" }}
          >
            Fresh bread & pastries, made daily
          </h1>
          <p
            className="mx-auto mt-4 max-w-xl text-lg"
            style={{ color: "#6b5d4f" }}
          >
            We bake everything from scratch in our neighborhood bakery. Stop by for a loaf, a coffee, or a custom cake for your next celebration.
          </p>
        </section>

        {/* Services */}
        <section className="mt-16 sm:mt-24">
          <h2
            className="text-center text-2xl font-semibold"
            style={{ color: "#2c2419" }}
          >
            What we offer
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {[
              {
                icon: Coffee,
                title: "Daily bake",
                desc: "Bread, croissants, scones, and pastries. New batches throughout the day.",
              },
              {
                icon: Cake,
                title: "Custom cakes",
                desc: "Birthdays, weddings, and special occasions. Tell us your vision and we'll make it.",
              },
              {
                icon: PartyPopper,
                title: "Catering",
                desc: "Sandwich platters, pastries, and coffee for meetings and events.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl p-6 shadow-sm transition-shadow hover:shadow-md"
                style={{
                  backgroundColor: "#fffefb",
                  border: "1px solid #e8e0d5",
                }}
              >
                <item.icon
                  className="h-8 w-8"
                  style={{ color: "#8b6914" }}
                />
                <h3
                  className="mt-4 font-semibold"
                  style={{ color: "#2c2419" }}
                >
                  {item.title}
                </h3>
                <p className="mt-2 text-sm" style={{ color: "#6b5d4f" }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Testimonial */}
        <section className="mt-16 sm:mt-24">
          <blockquote
            className="rounded-2xl px-6 py-8 text-center sm:px-12"
            style={{
              backgroundColor: "#fffefb",
              border: "1px solid #e8e0d5",
            }}
          >
            <p className="text-lg" style={{ color: "#3d3429" }}>
              "The best sourdough in town. We get our weekly loaf here and wouldn't go anywhere else."
            </p>
            <cite className="mt-4 block text-sm" style={{ color: "#6b5d4f" }}>
              — Sarah M., regular customer
            </cite>
          </blockquote>
        </section>

        {/* Contact */}
        <section id="contact" className="mt-16 sm:mt-24">
          <h2
            className="text-2xl font-semibold"
            style={{ color: "#2c2419" }}
          >
            Visit us
          </h2>
          <p className="mt-2" style={{ color: "#6b5d4f" }}>
            Open Tue–Sun, 7am–4pm. Closed Mondays.
          </p>
          <div className="mt-6 flex flex-wrap gap-8">
            <a
              href="https://maps.google.com/?q=123+Main+St"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm transition-opacity hover:opacity-80"
              style={{ color: "#8b6914" }}
            >
              <MapPin className="h-4 w-4" />
              123 Main St, River City
            </a>
            <a
              href="tel:+15551234567"
              className="flex items-center gap-2 text-sm transition-opacity hover:opacity-80"
              style={{ color: "#8b6914" }}
            >
              <Phone className="h-4 w-4" />
              (555) 123-4567
            </a>
            <a
              href="mailto:hello@hearthandflour.com"
              className="flex items-center gap-2 text-sm transition-opacity hover:opacity-80"
              style={{ color: "#8b6914" }}
            >
              <Mail className="h-4 w-4" />
              hello@hearthandflour.com
            </a>
          </div>
          <div className="mt-8">
            <button
              type="button"
              onClick={() => setQuoteOpen(true)}
              className="rounded-full px-6 py-3 text-sm font-medium transition-opacity hover:opacity-90"
              style={{
                backgroundColor: "#8b6914",
                color: "#fffefb",
              }}
            >
              Request a quote for catering
            </button>
          </div>
        </section>
      </main>

      {/* Order / Quote modal */}
      {quoteOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(44, 36, 25, 0.6)" }}
          onClick={() => !submitted && setQuoteOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6 shadow-xl"
            style={{
              backgroundColor: "#fffefb",
              border: "1px solid #e8e0d5",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold" style={{ color: "#2c2419" }}>
                {submitted ? "Thank you!" : "Order or get a quote"}
              </h3>
              {!submitted && (
                <button
                  type="button"
                  onClick={() => setQuoteOpen(false)}
                  className="rounded-full p-1 transition-opacity hover:opacity-70"
                  style={{ color: "#6b5d4f" }}
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
            {submitted ? (
              <div className="mt-6 flex flex-col items-center gap-3 py-4">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full"
                  style={{ backgroundColor: "rgba(139, 105, 20, 0.2)" }}
                >
                  <Check className="h-6 w-6" style={{ color: "#8b6914" }} />
                </div>
                <p className="text-center" style={{ color: "#3d3429" }}>
                  We've received your request. We'll be in touch soon!
                </p>
              </div>
            ) : (
              <form onSubmit={handleQuoteSubmit} className="mt-4 space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium" style={{ color: "#2c2419" }}>
                    Name *
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData((d) => ({ ...d, name: e.target.value }))}
                    className="mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                    style={{ borderColor: "#e8e0d5", color: "#2c2419" }}
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium" style={{ color: "#2c2419" }}>
                    Email *
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData((d) => ({ ...d, email: e.target.value }))}
                    className="mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                    style={{ borderColor: "#e8e0d5", color: "#2c2419" }}
                  />
                </div>
                <div>
                  <label htmlFor="date" className="block text-sm font-medium" style={{ color: "#2c2419" }}>
                    Event date (if catering)
                  </label>
                  <input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData((d) => ({ ...d, date: e.target.value }))}
                    className="mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                    style={{ borderColor: "#e8e0d5", color: "#2c2419" }}
                  />
                </div>
                <div>
                  <label htmlFor="details" className="block text-sm font-medium" style={{ color: "#2c2419" }}>
                    Details
                  </label>
                  <textarea
                    id="details"
                    rows={3}
                    value={formData.details}
                    onChange={(e) => setFormData((d) => ({ ...d, details: e.target.value }))}
                    className="mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                    style={{ borderColor: "#e8e0d5", color: "#2c2419" }}
                    placeholder="What would you like to order or ask about?"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setQuoteOpen(false)}
                    className="rounded-full px-4 py-2 text-sm font-medium transition-opacity hover:opacity-80"
                    style={{ color: "#6b5d4f", border: "1px solid #e8e0d5" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-full px-5 py-2 text-sm font-medium transition-opacity hover:opacity-90"
                    style={{ backgroundColor: "#8b6914", color: "#fffefb" }}
                  >
                    Send request
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <footer
        className="mt-20 border-t px-4 py-6 text-center text-sm"
        style={{ borderColor: "#e8e0d5", color: "#6b5d4f" }}
      >
        <p>© Hearth & Flour. All rights reserved.</p>
        <Link
          href="/websites"
          className="mt-3 inline-block text-xs underline opacity-70 hover:opacity-100"
          style={{ color: "#6b5d4f" }}
        >
          Template demo — back to Focused on Tom
        </Link>
      </footer>
    </div>
  );
}
