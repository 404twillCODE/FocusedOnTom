# Contact Form (Formspree) — Setup & Docs

The site uses **Formspree** for the contact modal on `/contact`. Submissions are sent to Formspree; your real email is never shown on the site.

---

## 1. Create / verify your Formspree form

1. Go to [formspree.io](https://formspree.io) and sign up (free plan: 50 submissions/month).
2. Create a new form (or use an existing one).
3. Copy the form endpoint: `https://formspree.io/f/YOUR_FORM_ID`  
   Current default in code: `https://formspree.io/f/mdaladkg`.

The app sends a **JSON** body with:

- `name`, `email`, `message` (required)
- `subject`: `FocusedOnTom contact — {name}`
- `source`: `focusedontom.com`
- `company`: honeypot (leave empty; used for spam detection)

Formspree will email you when someone submits. Your reply-to is the submitter’s email; your address is only in Formspree’s dashboard, not on the site.

---

## 2. Set the endpoint in Vercel (recommended)

1. In Vercel: Project → **Settings** → **Environment Variables**.
2. Add:
   - **Name:** `NEXT_PUBLIC_FORMSPREE_ENDPOINT`
   - **Value:** `https://formspree.io/f/YOUR_FORM_ID` (use your real form ID).
   - **Environments:** Production (and Preview if you want).
3. Save and redeploy so the new env var is applied.

If this variable is not set, the app falls back to the default in code (`https://formspree.io/f/mdaladkg`), so local dev works without any env.

---

## 3. Test in production

1. Deploy to Vercel (with `NEXT_PUBLIC_FORMSPREE_ENDPOINT` set if you use it).
2. Open your live site → go to `/contact`.
3. Click the **Email** card to open the modal.
4. Fill name, email, message (message at least 5 characters) and click **Send**.
5. You should see “Sent! I'll get back to you soon.” and the modal should close after ~1 second.
6. In Formspree’s dashboard, confirm the submission appears (and that you received the email if you have notifications on).

**Spam check:** If the hidden “company” field is filled, the form shows success but does **not** send to Formspree (honeypot).

---

## 4. Privacy note

Your email address is **not** displayed or linked anywhere on the site. Visitors only use the modal; Formspree holds your email and forwards messages to you.
