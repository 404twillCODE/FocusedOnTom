"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Clock,
  CreditCard,
  ExternalLink,
  Globe,
  Mail,
  MessageCircle,
} from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { easeExpo } from "@/lib/motion";

const CASH_APP_USERNAME = "$BEETOG";
const CASH_APP_LINK = "https://cash.app/$BEETOG";
const CASH_APP_QR = "/cashapp.png";
const PAYPAL_LINK = "https://www.paypal.com/sendmoney?email=twj2390@gmail.com";
const PAYPAL_QR = "/paypal.jpg";

const domainSteps = [
  {
    step: 1,
    title: "Purchase your domain",
    body: "To get started, please purchase your own domain name. This is an annual fee you pay directly to the domain provider (not to me). Go to Namecheap.com, search for your desired domain (like yourbusiness.com)",
  },
  {
    step: 2,
    title: "Create your account",
    body: "Complete your purchase and create your Namecheap account if you don’t already have one.",
  },
  {
    step: 3,
    title: "Open Domain List",
    body: "After buying, go to Domain List in your account and click Manage next to your domain.",
  },
  {
    step: 4,
    title: "Share access with me",
    body: "Find Sharing & Transfer, then click Add New User. Enter my email (twj2390@gmail.com) and give me full access to the domain.",
  },
  {
    step: 5,
    title: "I’ll handle the rest",
    body: "Once that’s done, I’ll take care of the rest and get your website fully live.",
  },
];

export default function PaymentPage() {
  return (
    <div className="min-h-screen pb-10 pt-28 sm:pt-32">
      <section className="container-page max-w-3xl pb-12 text-center sm:pb-16">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: easeExpo }}
        >
          <p className="text-[11px] font-medium tracking-[0.24em] text-[var(--accent-light)]">
            SETUP
          </p>
          <h1
            className="mt-4 font-semibold tracking-tight text-[var(--text)]"
            style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
          >
            Complete your website setup
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-[var(--text-muted)]">
            This page explains how to complete your website setup, purchase your
            domain, and send payment so I can get your site fully live.
          </p>
          <Link
            href="/websites"
            className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-[var(--accent-light)] transition-colors hover:text-[var(--accent)]"
          >
            <ArrowRight className="h-4 w-4 rotate-180" />
            Back to websites
          </Link>
        </motion.div>
      </section>

      <section className="container-page max-w-3xl py-6 sm:py-10">
        <Reveal>
          <div className="rounded-2xl border border-white/10 bg-[var(--bg3)]/50 p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <Globe className="h-8 w-8 shrink-0 text-[var(--accent-light)]" />
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-[var(--text)] sm:text-2xl">
                  Domain setup
                </h2>
                <p className="mt-0.5 text-sm text-[var(--text-muted)]">
                  Follow these steps so I can connect your site to your domain.
                </p>
              </div>
            </div>
            <ol className="mt-8 space-y-6">
              {domainSteps.map((item) => (
                <li key={item.step} className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--accent)]/40 bg-[var(--accent-soft)] text-sm font-semibold text-[var(--accent-light)]">
                    {item.step}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-[var(--text)]">{item.title}</h3>
                    <p className="mt-1 text-[var(--text-muted)]">
                      {item.body}
                      {item.step === 1 && (
                        <>
                          {" "}
                          <a
                            href="https://www.namecheap.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-0.5 text-[var(--accent-light)] underline decoration-[var(--accent)]/40 underline-offset-2"
                          >
                            Namecheap.com
                            <ExternalLink className="ml-0.5 h-3.5 w-3.5" />
                          </a>
                        </>
                      )}
                      {item.step === 4 && (
                        <>
                          {" "}
                          <span className="inline-flex items-center gap-1 rounded bg-white/[0.04] px-1.5 py-0.5 font-medium text-[var(--text)]">
                            <Mail className="h-3.5 w-3.5" />
                            twj2390@gmail.com
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </Reveal>
      </section>

      <section className="container-page max-w-3xl py-6">
        <Reveal delay={0.08}>
          <div className="rounded-2xl border border-white/10 bg-[var(--bg3)]/50 p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <Mail className="h-8 w-8 shrink-0 text-[var(--accent-light)]" />
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-[var(--text)] sm:text-2xl">
                  Contact form (Formspree)
                </h2>
                <p className="mt-0.5 text-sm text-[var(--text-muted)]">
                  If your website has a contact form, you need to hook it up to
                  Formspree so messages send to your inbox.
                </p>
              </div>
            </div>
            <ol className="mt-8 space-y-4">
              {[
                {
                  n: 1,
                  t: "Create your Formspree form",
                  b: "Create a Formspree account, then a new project. After you create the form, Formspree will show your unique form endpoint.",
                },
                {
                  n: 2,
                  t: "Paste the Formspree endpoint",
                  b: "Copy the endpoint URL from your Formspree project.",
                },
                {
                  n: 3,
                  t: "Send me your endpoint",
                  b: "Send me that endpoint URL and I’ll connect your site’s contact form so you can receive messages.",
                },
              ].map((s) => (
                <li key={s.n} className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--accent)]/40 bg-[var(--accent-soft)] text-sm font-semibold text-[var(--accent-light)]">
                    {s.n}
                  </span>
                  <div>
                    <h3 className="font-semibold text-[var(--text)]">{s.t}</h3>
                    <p className="mt-1 text-[var(--text-muted)]">{s.b}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-6 flex gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <Clock className="h-5 w-5 shrink-0 text-[var(--accent-light)]" />
              <p className="text-sm text-[var(--text-muted)]">
                This will send you emails from your contact form. It&apos;s free
                unless you need more than{" "}
                <strong className="text-[var(--text)]">50 submissions/month</strong>.
                If you do not have a contact form yet, you can skip this for now.
              </p>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="container-page max-w-3xl py-6">
        <Reveal delay={0.1}>
          <div className="rounded-2xl border border-white/10 bg-[var(--bg3)]/50 p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <CreditCard className="h-8 w-8 shrink-0 text-[var(--accent-light)]" />
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-[var(--text)] sm:text-2xl">
                  Payment
                </h2>
                <p className="mt-0.5 text-sm text-[var(--text-muted)]">
                  After your domain is purchased and shared with me, send payment
                  for the website. I need payment before setting your site live. I
                  prefer Cash App but PayPal works too.
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              <a
                href={CASH_APP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-colors hover:border-[var(--accent)]/40 sm:p-8"
              >
                <span className="text-lg font-semibold text-[var(--text)]">Cash App</span>
                <span className="mt-2 text-2xl font-bold text-[var(--accent-light)]">
                  {CASH_APP_USERNAME}
                </span>
                <div className="relative mt-6 aspect-square w-40 overflow-hidden rounded-2xl border border-[var(--accent)]/25 bg-white p-3 sm:w-44">
                  <Image
                    src={CASH_APP_QR}
                    alt="Cash App QR code"
                    fill
                    className="object-contain"
                    sizes="176px"
                  />
                </div>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] group-hover:text-[var(--accent-light)]">
                  Open Cash App
                  <ExternalLink className="h-4 w-4" />
                </span>
              </a>

              <a
                href={PAYPAL_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-colors hover:border-[var(--accent)]/40 sm:p-8"
              >
                <span className="text-lg font-semibold text-[var(--text)]">PayPal</span>
                <p className="mt-2 text-center text-sm text-[var(--text-muted)]">
                  Use <strong className="text-[var(--text)]">Friends & Family</strong>{" "}
                  when sending so there are no extra fees.
                </p>
                <div className="relative mt-6 aspect-square w-40 overflow-hidden rounded-2xl border border-[var(--accent)]/25 bg-white p-3 sm:w-44">
                  <Image
                    src={PAYPAL_QR}
                    alt="PayPal QR code"
                    fill
                    className="object-contain"
                    sizes="176px"
                  />
                </div>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] group-hover:text-[var(--accent-light)]">
                  Open PayPal
                  <ExternalLink className="h-4 w-4" />
                </span>
              </a>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="container-page max-w-3xl py-6 pb-20">
        <Reveal delay={0.12}>
          <div className="rounded-2xl border border-white/10 bg-[var(--bg3)]/50 p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <MessageCircle className="h-8 w-8 shrink-0 text-[var(--accent-light)]" />
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-[var(--text)] sm:text-2xl">
                  Stay in contact
                </h2>
                <p className="mt-0.5 text-sm text-[var(--text-muted)]">
                  Keep me in the loop so we can get your site live smoothly.
                </p>
              </div>
            </div>
            <p className="mt-6 text-[var(--text-muted)]">
              Reach out when you&apos;ve got your domain, if you have questions about
              access or payment, or anything else. It also helps when you let me
              know when you&apos;ve given me access and when you&apos;ve sent payment.
            </p>
            <div className="mt-5 flex gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <Clock className="h-5 w-5 shrink-0 text-[var(--accent-light)]" />
              <p className="text-sm text-[var(--text-muted)]">
                Once I confirm payment and domain access, it usually takes around{" "}
                <strong className="text-[var(--text)]">1–24 hours</strong> for the
                website (and domain) to update and go fully live.
              </p>
            </div>
            <Link
              href="/contact"
              className="mt-6 inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/40 bg-[var(--accent-soft)] px-4 py-2.5 text-sm font-medium text-[var(--accent-light)] transition-colors hover:border-[var(--accent)]/70"
            >
              Contact me
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
