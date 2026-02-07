# Deployment

## Site mode: Development vs Live

The site can run in two modes controlled by the environment variable **`NEXT_PUBLIC_SITE_MODE`**.

| Value         | Behavior |
|---------------|----------|
| `development` | Public visitors see the **holding page** (“In Development”). You can bypass with a secret query param or cookie to preview the full site. |
| `live`        | Full site is visible to everyone. No holding page, no bypass. |

**Default:** If `NEXT_PUBLIC_SITE_MODE` is not set, it defaults to **`development`** so the holding page is shown until you explicitly go live.

---

## Going live

1. Set the env var to `live` in your hosting (Vercel, etc.):
   ```bash
   NEXT_PUBLIC_SITE_MODE=live
   ```
2. Redeploy. All routes will serve the real site; the holding page is only reachable at `/holding`.

To switch back to “in development”, set:
   ```bash
   NEXT_PUBLIC_SITE_MODE=development
   ```
   and redeploy.

---

## Previewing the full site while in development mode

When `NEXT_PUBLIC_SITE_MODE` is **not** `live`, the app rewrites all non-public routes to the holding page unless you use one of these:

### 1. Query param (one-time or to set the cookie)

Open any URL with **`?preview=1`**:

- **`https://yoursite.com/?preview=1`**

The first time you use it, the server sets a cookie so later visits (without the param) still show the full site.

### 2. Cookie (after you’ve used `?preview=1` once)

- **Name:** `fot_preview`  
- **Value:** `1`  
- **Duration:** 30 days (set by the server when you use `?preview=1`)

Once this cookie is set, you can open the site normally (no query param) and still see the full site.

### 3. “Owner Preview” on the holding page

On the holding page, the **Owner Preview** button links to **`/?preview=1`**. Click it to enter preview and get the cookie set.

---

## Clearing the preview cookie (exit preview)

- **From the site:** When you’re in preview, a top banner says **“Preview Mode (Site In Development)”** with an **Exit** button. Click **Exit** to clear the cookie and go back to the holding page.

- **Manually:** Delete the `fot_preview` cookie for your domain (browser dev tools → Application → Cookies, or clear site data).

- **Expiry:** The cookie expires after 30 days if you don’t clear it.

---

## Local development

- To see the **full site** locally without using preview every time, set in `.env.local`:
  ```bash
  NEXT_PUBLIC_SITE_MODE=live
  ```
- To test the **holding page and bypass** flow, leave `NEXT_PUBLIC_SITE_MODE` unset (or set to `development`) and use `/?preview=1` or the Owner Preview button.

Local dev is not gated by default; only the env var and cookie/query param control what you see.
