// ---------------------------------------------------------------------------
// Shared types for the photography premium platform.
// ---------------------------------------------------------------------------

export type LicenseId = "personal" | "commercial" | "unlimited";

export type LicenseTier = {
  id: LicenseId;
  name: string;
  priceCents: number;
  /** Shown on the buy dialog as a short summary. */
  tagline: string;
  /** Bulleted copy shown inside the card. */
  details: string[];
  /** `true` when this tier is a recurring subscription (not a one-time purchase). */
  subscription?: boolean;
  /** Optional Stripe Price ID env var (filled in by config). */
  stripePriceEnvVar?: string;
};

export type OrderStatus = "pending" | "paid" | "delivered" | "failed" | "refunded";

export type PhotoOrder = {
  id: string;
  stripe_session_id: string | null;
  buyer_email: string;
  user_id: string | null;
  photo_id: string;
  photo_path: string;
  license: LicenseId;
  amount_cents: number;
  status: OrderStatus;
  download_token: string | null;
  download_count: number;
  expires_at: string | null;
  created_at: string;
};

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "incomplete"
  | "unpaid";

export type Subscription = {
  user_id: string;
  email: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: SubscriptionStatus;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
};

export type PrivateGalleryState =
  | "proofing"
  | "editing"
  | "final_delivery"
  | "approved";

export type PrivateGallery = {
  id: string;
  slug: string;
  title: string;
  client_name: string | null;
  client_email: string | null;
  password_hash: string;
  state: PrivateGalleryState;
  allow_all_zip: boolean;
  final_message: string | null;
  created_at: string;
  expires_at: string | null;
};

export type PrivateFavorite = {
  gallery_id: string;
  photo_path: string;
  note: string | null;
  created_at: string;
};

export type PrivateGalleryPhoto = {
  gallery_id: string;
  photo_path: string;
  is_final: boolean;
  final_url: string | null;
};

export type AnalyticsEventName =
  | "photo_view"
  | "lightbox_open"
  | "photo_like"
  | "photo_favorite"
  | "buy_click"
  | "license_click"
  | "print_click"
  | "book_click"
  | "private_login"
  | "private_favorite"
  | "private_submit"
  | "private_approve"
  | "newsletter_subscribe";

export type AnalyticsEvent = {
  id: string;
  name: AnalyticsEventName | string;
  props: Record<string, unknown>;
  user_id: string | null;
  anon_id: string | null;
  path: string | null;
  created_at: string;
};

export type PrintSize = {
  id: string;
  label: string;
  widthIn: number;
  heightIn: number;
  priceCents: number;
};

export type PrintPaper = {
  id: string;
  label: string;
  priceDeltaCents: number;
};

export type PrintProduct = {
  sizes: PrintSize[];
  papers: PrintPaper[];
};

export type SessionType = {
  id: string;
  label: string;
  description: string;
  depositCents: number;
  durationMin: number;
};

export type BookingStatus =
  | "requested"
  | "deposit_paid"
  | "confirmed"
  | "canceled"
  | "completed";

export type Booking = {
  id: string;
  email: string;
  name: string;
  session_type: string;
  starts_at: string;
  notes: string | null;
  stripe_session_id: string | null;
  deposit_amount_cents: number;
  status: BookingStatus;
  created_at: string;
};
