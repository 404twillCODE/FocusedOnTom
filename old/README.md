# Focused on Tom

Personal site for Tom Williams — explore, photography, and builds.

## Dev

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Structure

- `/` — homepage
- `/explore` — places & outdoors
- `/photos` — photography
- `/projects` — code / websites
- `/about` — about Tom
- `/contact` — contact (animated layout + Formspree)

## Images

Replace placeholders in:

```
public/images/hero/
public/images/explore/
public/images/photography/
public/images/projects/
```

## Env

# Copy from `.env.example`. Local secrets live in `.env.local`.
#
# Explore New York (Phase 2A) also needs:
#   NEXT_PUBLIC_SUPABASE_URL
#   NEXT_PUBLIC_SUPABASE_ANON_KEY
#   SUPABASE_SERVICE_ROLE_KEY
# See docs/explore.md for migrations, seed, admin user, and DEC imports.

The previous site is archived under `legacy-site/`.
