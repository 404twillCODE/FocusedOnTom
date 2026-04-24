// ---------------------------------------------------------------------------
// Transactional email wrapper.
//
// Uses Resend (https://resend.com) when RESEND_API_KEY is set. Otherwise
// falls back to logging the email to the server console so you can confirm
// triggers fire during local dev without configuring anything.
// ---------------------------------------------------------------------------

type EmailPayload = {
  to: string | string[];
  subject: string;
  html: string;
  /** Optional plaintext fallback. Generated from html if omitted. */
  text?: string;
  /** Override the configured from-address. */
  from?: string;
};

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

function defaultFrom(): string {
  return (
    process.env.RESEND_FROM_EMAIL?.trim() ||
    "Focused On Tom <hello@focusedontom.com>"
  );
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Send an email. Never throws — on failure, logs and returns
 * `{ ok: false, error }`. Callers should not surface errors to users.
 */
export async function sendEmail(
  payload: EmailPayload
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const key = process.env.RESEND_API_KEY?.trim();
  const from = payload.from ?? defaultFrom();
  const toList = Array.isArray(payload.to) ? payload.to : [payload.to];

  if (!key) {
    console.log("[email:noop]", {
      from,
      to: toList,
      subject: payload.subject,
      preview: stripHtml(payload.html).slice(0, 180),
    });
    return { ok: true };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        from,
        to: toList,
        subject: payload.subject,
        html: payload.html,
        text: payload.text ?? stripHtml(payload.html),
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error("[email] Resend failed", res.status, err);
      return { ok: false, error: err };
    }
    const data = (await res.json()) as { id?: string };
    return { ok: true, id: data.id };
  } catch (err) {
    console.error("[email] send failed", err);
    return { ok: false, error: (err as Error).message };
  }
}

export function ownerNotificationEmail(): string | null {
  const v = process.env.OWNER_NOTIFICATION_EMAIL?.trim();
  return v && v.length > 0 ? v : null;
}
