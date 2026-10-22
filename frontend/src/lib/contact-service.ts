export type ContactFields = Partial<
  Record<"name" | "email" | "message" | "_gotcha", string>
>;
export class ContactError extends Error {
  fields: ContactFields;
  constructor(message: string, fields: ContactFields = {}) {
    super(message);
    this.name = "ContactError";
    this.fields = fields;
  }
}

export function validateContact(values: Record<string, unknown>) {
  const data = {
    name: String(values.name || "").trim(),
    email: String(values.email || "").trim(),
    message: String(values.message || "").trim(),
    _gotcha: String(values._gotcha || "").trim(),
  };
  const errors: ContactFields = {};
  if (!data.name) errors.name = "Please enter your name.";
  else if (data.name.length > 100 || /[\r\n]/.test(data.name))
    errors.name = "Please use a name under 100 characters.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) || data.email.length > 254)
    errors.email = "Please enter a valid email address.";
  if (data.message.length < 5)
    errors.message = "Tell me a little more—at least 5 characters.";
  else if (data.message.length > 6000)
    errors.message = "Please keep your note under 6,000 characters.";
  if (data._gotcha) errors._gotcha = "Please leave this field empty.";
  return { data, errors };
}

export async function sendContact(
  endpoint: string,
  values: Record<string, unknown>,
  {
    fetcher = fetch,
    signal = AbortSignal.timeout(20000),
  }: { fetcher?: typeof fetch; signal?: AbortSignal } = {},
) {
  const { data, errors } = validateContact(values);
  if (Object.keys(errors).length)
    throw new ContactError("Please check your note before sending.", errors);
  let url;
  try {
    url = new URL(endpoint);
  } catch {
    throw new ContactError(
      "The message service is unavailable. Your note is still here.",
    );
  }
  if (
    url.origin !== "https://formspree.io" ||
    !/^\/f\/[a-z0-9]+$/i.test(url.pathname)
  )
    throw new ContactError(
      "The message service is unavailable. Your note is still here.",
    );
  let response;
  try {
    response = await fetcher(url.href, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...data,
        subject: `FocusedOnTom contact — ${data.name}`,
        source: "focusedontom.com",
      }),
      signal,
    });
  } catch {
    throw new ContactError(
      "Couldn’t reach the message service. Your note is still here—check your connection and try again.",
    );
  }
  let result;
  try {
    result = await response.json();
  } catch {}
  if (response.ok && result?.ok === true) return data;
  if (response.status === 429)
    throw new ContactError(
      "Too many messages just now. Your note is still here—please wait a few minutes and try again.",
    );
  const fields: ContactFields = {};
  for (const error of Array.isArray(result?.errors) ? result.errors : [])
    if (
      ["name", "email", "message"].includes(error.field) &&
      typeof error.message === "string"
    )
      fields[error.field as keyof ContactFields] = error.message;
  throw new ContactError(
    "Your message didn’t send. Your note is still here—please try again in a moment.",
    fields,
  );
}
