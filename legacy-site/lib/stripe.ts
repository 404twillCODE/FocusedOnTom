// ---------------------------------------------------------------------------
// Stripe server client — lazily constructed. Returns `null` when
// STRIPE_SECRET_KEY is not configured so the site still builds and
// checkout routes can return a friendly "not configured" response.
// ---------------------------------------------------------------------------

import Stripe from "stripe";

let cached: Stripe | null | undefined;

export function getStripe(): Stripe | null {
  if (cached !== undefined) return cached;
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    cached = null;
    return cached;
  }
  cached = new Stripe(key, {
    // Pin API version so types match. Stripe updates this periodically.
    apiVersion: "2026-04-22.dahlia",
    typescript: true,
  });
  return cached;
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

/** Resolve a Stripe Price ID by the env-var name declared in the license config. */
export function resolvePriceId(envVar: string | undefined): string | null {
  if (!envVar) return null;
  const v = process.env[envVar]?.trim();
  return v && v.length > 0 ? v : null;
}
