import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  ContactError,
  sendContact,
  validateContact,
  type ContactFields,
} from "../lib/contact-service";
import { useMotion } from "../motion/MotionProvider";

export default function ContactCard({ request }: { request: number }) {
  const { disabled } = useMotion();
  const card = useRef<HTMLDivElement>(null),
    form = useRef<HTMLFormElement>(null),
    name = useRef<HTMLInputElement>(null),
    previousHeight = useRef<number | null>(null),
    animation = useRef<Animation | null>(null),
    trigger = useRef<HTMLElement | null>(null);
  const [open, setOpen] = useState(false),
    [state, setState] = useState<"editing" | "sending" | "sent" | "error">(
      "editing",
    ),
    [errors, setErrors] = useState<ContactFields>({}),
    [status, setStatus] = useState(""),
    [email, setEmail] = useState("");
  const sending = state === "sending";
  const rememberHeight = () => {
    previousHeight.current = card.current?.offsetHeight ?? null;
  };
  function compose() {
    rememberHeight();
    trigger.current = document.activeElement as HTMLElement;
    setOpen(true);
    if (state === "sent") {
      setState("editing");
      setStatus("");
      setErrors({});
    }
  }
  useEffect(() => {
    if (request) compose();
  }, [request]);
  useLayoutEffect(() => {
    const element = card.current;
    if (!element) return;
    animation.current?.cancel();
    if (previousHeight.current !== null && !disabled) {
      animation.current = element.animate(
        [
          { height: previousHeight.current + "px" },
          { height: element.offsetHeight + "px" },
        ],
        {
          duration: state === "editing" ? 650 : 550,
          easing: "cubic-bezier(.22,1,.36,1)",
        },
      );
      const content = element.querySelector<HTMLElement>(
        open ? ".letter-compose" : ".letter-summary",
      );
      content?.animate(
        [
          { opacity: 0, transform: "translateY(18px)" },
          { opacity: 1, transform: "none" },
        ],
        {
          duration: 550,
          delay: 100,
          easing: "cubic-bezier(.22,1,.36,1)",
          fill: "backwards",
        },
      );
    }
    previousHeight.current = null;
    if (open && state === "editing")
      name.current?.focus({ preventScroll: true });
    if (state === "sent")
      element
        .querySelector<HTMLElement>(".contact-success")
        ?.focus({ preventScroll: true });
    if (open) {
      const finish = () => {
        const rect = element.getBoundingClientRect();
        if (rect.top < 90 || rect.bottom > innerHeight - 20)
          element.scrollIntoView({
            behavior: disabled ? "instant" : "smooth",
            block: "start",
          });
      };
      if (animation.current)
        void animation.current.finished.then(finish).catch(() => {});
      else finish();
    }
    return () => animation.current?.cancel();
  }, [open, state, disabled]);
  function close() {
    if (sending) return;
    rememberHeight();
    setOpen(false);
    trigger.current?.focus({ preventScroll: true });
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;
    const values = Object.fromEntries(new FormData(event.currentTarget)),
      validation = validateContact(values);
    setErrors(validation.errors);
    setStatus("");
    if (Object.keys(validation.errors).length) {
      setState("error");
      setStatus("A few details need checking.");
      const field = Object.keys(validation.errors)[0];
      form.current
        ?.querySelector<HTMLInputElement | HTMLTextAreaElement>(
          `[name="${field}"]`,
        )
        ?.focus({ preventScroll: true });
      return;
    }
    setState("sending");
    try {
      const sent = await sendContact(event.currentTarget.action, values);
      rememberHeight();
      setEmail(sent.email);
      form.current?.reset();
      setState("sent");
    } catch (error) {
      setErrors(error instanceof ContactError ? error.fields : {});
      setStatus(
        error instanceof Error
          ? error.message
          : "Your message didn’t send. Please try again.",
      );
      setState("error");
    }
  }
  const clear = (field: keyof ContactFields) => {
    setErrors((current) => ({ ...current, [field]: undefined }));
    setStatus("");
  };
  return (
    <div
      ref={card}
      id="contact-card"
      // Keep the observer-owned reveal classes stable across form state changes.
      className="contact-letter reveal"
      data-composing={open || undefined}
      data-form-state={state}
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          event.preventDefault();
          close();
        }
      }}
    >
      <div className="contact-letter-top">
        <span>
          <i /> A NOTE TO TOM
        </span>
        <span className="letter-decoration" aria-hidden="true">
          ↗
        </span>
        <button
          id="close-contact"
          className="contact-back"
          type="button"
          aria-label="Back to note"
          hidden={!open}
          disabled={sending}
          onClick={close}
        >
          ↶
        </button>
      </div>
      <div id="contact-summary" className="letter-summary" hidden={open}>
        <span className="letter-handwriting">Good things start somewhere.</span>
        <h3>
          What are you
          <br />
          thinking?
        </h3>
        <p>
          A place, a project, a question.
          <br />
          Start anywhere. I’m listening.
        </p>
        <button
          className="contact-send"
          data-contact
          aria-controls="contact-compose"
          aria-expanded={open}
          onClick={compose}
        >
          Tell me your idea <span>↗</span>
        </button>
        <span className="contact-letter-foot">
          STRAIGHT TO MY INBOX. FROM YOU TO ME.
        </span>
      </div>
      <div
        id="contact-compose"
        className="letter-compose"
        role="region"
        aria-labelledby={
          state === "sent" ? "contact-success-title" : "contact-form-title"
        }
        hidden={!open}
      >
        <div id="contact-editor" hidden={state === "sent"}>
          <h3 id="contact-form-title">Tell me your idea.</h3>
          <p>A few details, straight to me.</p>
          <form
            ref={form}
            id="contact-form"
            action="https://formspree.io/f/mdaladkg"
            method="post"
            noValidate
            aria-busy={sending || undefined}
            onSubmit={submit}
          >
            <div className="contact-field-row">
              <label htmlFor="contact-name">
                Your name
                <input
                  ref={name}
                  id="contact-name"
                  name="name"
                  autoComplete="name"
                  maxLength={100}
                  required
                  placeholder="Your name"
                  readOnly={sending}
                  aria-describedby="contact-name-error"
                  aria-invalid={!!errors.name || undefined}
                  onInput={() => clear("name")}
                />
                <span id="contact-name-error" className="contact-field-error">
                  {errors.name}
                </span>
              </label>
              <label htmlFor="contact-email">
                Email address
                <input
                  id="contact-email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  maxLength={254}
                  required
                  placeholder="you@example.com"
                  readOnly={sending}
                  aria-describedby="contact-email-error"
                  aria-invalid={!!errors.email || undefined}
                  onInput={() => clear("email")}
                />
                <span id="contact-email-error" className="contact-field-error">
                  {errors.email}
                </span>
              </label>
            </div>
            <label htmlFor="contact-message">
              What do you have in mind?
              <textarea
                id="contact-message"
                name="message"
                rows={4}
                minLength={5}
                maxLength={6000}
                required
                placeholder="A project, a question, something interesting…"
                readOnly={sending}
                aria-describedby="contact-message-error"
                aria-invalid={!!errors.message || undefined}
                onInput={() => clear("message")}
              />
              <span id="contact-message-error" className="contact-field-error">
                {errors.message}
              </span>
            </label>
            <div className="contact-trap" aria-hidden="true">
              <label>
                Leave this empty
                <input
                  name="_gotcha"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                />
              </label>
            </div>
            <button className="contact-send" type="submit" disabled={sending}>
              {sending
                ? "Sending your note…"
                : state === "error"
                  ? "Try again"
                  : "Send message"}
              {!sending && (
                <>
                  {" "}
                  <span>↗</span>
                </>
              )}
            </button>
            <p
              id="form-status"
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              {status}
            </p>
          </form>
        </div>
        <div
          id="contact-success"
          className="contact-success"
          tabIndex={-1}
          hidden={state !== "sent"}
        >
          <span className="contact-success-mark" aria-hidden="true">
            ✓
          </span>
          <span className="small-note">THANKS FOR THE NOTE</span>
          <h3 id="contact-success-title">Message sent.</h3>
          <p>
            I’ll get back to you at
            <br />
            <strong id="contact-reply-email">{email}</strong>.
          </p>
          <button
            id="contact-write-another"
            className="contact-send"
            type="button"
            onClick={() => {
              rememberHeight();
              setState("editing");
              setErrors({});
              setStatus("");
            }}
          >
            Write another note <span>↗</span>
          </button>
        </div>
      </div>
    </div>
  );
}
