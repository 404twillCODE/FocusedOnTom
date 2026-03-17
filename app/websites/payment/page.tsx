"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import {
  Globe,
  CreditCard,
  ArrowRight,
  Mail,
  ExternalLink,
} from "lucide-react";

const CASH_APP_USERNAME = "$BEETOG";
const CASH_APP_LINK = "https://cash.app/$BEETOG";
const CASH_APP_QR = "/cashapp.png";
const PAYPAL_LINK = "https://www.paypal.com/sendmoney?email=twj2390@gmail.com";
const PAYPAL_QR = "/paypal.jpg";

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

const domainSteps = [
  {
    step: 1,
    title: "Purchase your domain",
    body: "Before I finish setting everything up, I just need you to buy your domain. Head to Namecheap.com and search for the domain you want (e.g. yourbusiness.com).",
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
    <main className="min-h-screen">
      {/* Intro */}
      <section className="mx-auto max-w-3xl px-4 pt-24 pb-12 sm:px-6 sm:pt-28 sm:pb-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="text-center"
        >
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--text)] sm:text-4xl">
            Complete your website setup
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-[var(--textMuted)]">
            This page explains how to complete your website setup, purchase your
            domain, and send payment so I can get your site fully live.
          </p>
          <Link
            href="/websites"
            className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-[var(--ice)] transition-colors hover:text-[var(--ice)]/90"
          >
            <ArrowRight className="h-4 w-4 rotate-180" />
            Back to websites
          </Link>
        </motion.div>
      </section>

      {/* Domain setup */}
      <section className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <AnimatedSection>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg2)]/30 p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <Globe className="h-8 w-8 shrink-0 text-[var(--ice)]" />
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-[var(--text)] sm:text-2xl">
                  Domain setup
                </h2>
                <p className="mt-0.5 text-sm text-[var(--textMuted)]">
                  Follow these steps so I can connect your site to your domain.
                </p>
              </div>
            </div>
            <ol className="mt-8 space-y-6">
              {domainSteps.map((item, i) => (
                <li key={item.step} className="flex gap-4">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--ice)]/40 bg-[var(--iceSoft)]/20 text-sm font-semibold text-[var(--ice)]"
                    aria-hidden
                  >
                    {item.step}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-[var(--text)]">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-[var(--textMuted)]">
                      {item.body}
                      {item.step === 1 && (
                        <>
                          {" "}
                          <a
                            href="https://www.namecheap.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-0.5 text-[var(--ice)] underline decoration-[var(--ice)]/50 underline-offset-2 transition-colors hover:decoration-[var(--ice)]"
                          >
                            Namecheap.com
                            <ExternalLink className="ml-0.5 h-3.5 w-3.5" />
                          </a>
                        </>
                      )}
                      {item.step === 4 && (
                        <>
                          {" "}
                          <span className="inline-flex items-center gap-1 rounded bg-[var(--bg3)]/80 px-1.5 py-0.5 font-medium text-[var(--text)]">
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
        </AnimatedSection>
      </section>

      {/* Payment */}
      <section className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:pb-24">
        <AnimatedSection delay={0.1}>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg2)]/30 p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <CreditCard className="h-8 w-8 shrink-0 text-[var(--ice)]" />
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-[var(--text)] sm:text-2xl">
                  Payment
                </h2>
                <p className="mt-0.5 text-sm text-[var(--textMuted)]">
                  After your domain is purchased and shared with me, send
                  payment for the website. I need payment before setting up your
                  site live.
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              {/* Cash App */}
              <a
                href={CASH_APP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center rounded-2xl border border-[var(--border)] bg-[var(--bg3)]/40 p-6 transition-colors hover:border-[var(--ice)]/40 hover:bg-[var(--iceSoft)]/10 sm:p-8"
              >
                <span className="text-lg font-semibold text-[var(--text)]">
                  Cash App
                </span>
                <span className="mt-2 text-2xl font-bold text-[var(--ice)]">
                  {CASH_APP_USERNAME}
                </span>
                <div className="relative mt-6 aspect-square w-40 shrink-0 overflow-hidden rounded-2xl border-2 border-[var(--ice)]/20 bg-white p-3 shadow-[0_4px_20px_rgba(0,0,0,0.25)] transition-all group-hover:border-[var(--ice)]/40 group-hover:shadow-[0_6px_24px_var(--iceGlow)] sm:w-44 sm:p-4">
                  <Image
                    src={CASH_APP_QR}
                    alt="Cash App QR code"
                    fill
                    className="object-contain"
                    sizes="176px"
                  />
                </div>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm text-[var(--textMuted)] group-hover:text-[var(--ice)]">
                  Open Cash App
                  <ExternalLink className="h-4 w-4" />
                </span>
              </a>

              {/* PayPal */}
              <a
                href={PAYPAL_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center rounded-2xl border border-[var(--border)] bg-[var(--bg3)]/40 p-6 transition-colors hover:border-[var(--ice)]/40 hover:bg-[var(--iceSoft)]/10 sm:p-8"
              >
                <span className="text-lg font-semibold text-[var(--text)]">
                  PayPal
                </span>
                <p className="mt-2 text-center text-sm text-[var(--textMuted)]">
                  Use <strong className="text-[var(--text)]">Friends & Family</strong> when sending so there are no extra fees.
                </p>
                <div className="relative mt-6 aspect-square w-40 shrink-0 overflow-hidden rounded-2xl border-2 border-[var(--ice)]/20 bg-white p-3 shadow-[0_4px_20px_rgba(0,0,0,0.25)] transition-all group-hover:border-[var(--ice)]/40 group-hover:shadow-[0_6px_24px_var(--iceGlow)] sm:w-44 sm:p-4">
                  <Image
                    src={PAYPAL_QR}
                    alt="PayPal QR code"
                    fill
                    className="object-contain"
                    sizes="176px"
                  />
                </div>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm text-[var(--textMuted)] group-hover:text-[var(--ice)]">
                  Open PayPal
                  <ExternalLink className="h-4 w-4" />
                </span>
              </a>
            </div>
          </div>
        </AnimatedSection>
      </section>
    </main>
  );
}
