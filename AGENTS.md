# Agent guide

Quick orientation for AI agents (Claude, Cursor, etc.) working on this repo.

## What this project is

A **single-page static site** that tracks buy/sell prices and stock for Japanese Pokemon TCG booster sets. State persists to a public Supabase table via the anon key (security is enforced by RLS, not by hiding the key). No framework, no build tooling beyond a 25-line `build.mjs` for env-var injection.

## File map

```
index.html              The entire app — HTML, scoped <style>, inline <script>.
                        ~1500 lines. Search by alt text (e.g. "Abyss Eye")
                        to find a specific set.
build.mjs               Substitutes __PLACEHOLDER__ tokens before deploy.
vercel.json             Vercel build config (primary deploy).
.github/workflows/      GitHub Pages workflow (backup deploy).
boosters/               One PNG per booster set. Filename = data-key prefix.
og-image.jpg            1200×630 social link preview.
favicon.svg             Pokeball SVG.
```

## Placeholder substitution

`build.mjs` runs at deploy time and replaces three placeholders in `index.html`:

| Token | Source env var | What it becomes |
|---|---|---|
| `__SUPABASE_URL__` | `SUPABASE_URL` | Supabase REST endpoint |
| `__SUPABASE_ANON_KEY__` | `SUPABASE_ANON_KEY` | Supabase anon JWT (public-safe) |
| `__SITE_URL__` | `SITE_URL` or `VERCEL_PROJECT_PRODUCTION_URL` | Used in OG tags for absolute URLs |

**Never commit substituted values.** The repo always holds the placeholder form. To test locally without deploy, pass the env vars to `node build.mjs` and remember to revert before committing (see "Local dev" below).

## Critical conventions

### `data-key` naming for inputs

Every price/stock input has a `data-key` like `MG6-abyss-eye-buy`. The pattern is `{set-code}-{slug}-{field}` where field is one of `buy`, `sell`, `stock`. These keys are the **primary key in the `prices` Supabase table** — renaming a key orphans its data. If you must rename, plan a SQL migration alongside.

### Booster image paths

Each set's booster pack PNG lives at `boosters/{set-code}-{slug}.png` and is referenced from `<img class="booster-img">` tags. The slug component matches the data-key slug exactly.

### Watermark mask

`.booster-img` has a `mask-image` linear gradient cropping the left and right margins (~24% on each side). This hides the "JAPAN2UK" watermark present in every source image. Don't remove it — the booster art is centered, so the mask preserves it. If you replace booster images from a different (unwatermarked) source, you can drop the mask.

### Logo fallback chain

`.set-logo` images use Serebii as primary (`https://www.serebii.net/card/logo/{slug}.png`) with a `tryNext()` fallback to tcgdex. If you add a new set, look up the Serebii slug from `www.serebii.net/card/{slug}/` first.

## Common tasks

### Download booster art from Japan2UK

Pack art is **always** taken from the Japan2UK **booster pack** product (not the box, not Korean listings). The shop watermarks the left/right margins; the shared `.booster-img` CSS mask crops those away. Do not source pack art from Serebii, TCGdex, or a random Google image.

1. Find the pack product. Handle pattern is `pokemon-{slug}-{setcode}-japanese-booster-pack` (High Class sets often include `high-class` in the handle). Examples:
   - `https://www.japan2uk.com/products/pokemon-storm-emeralda-m6-japanese-booster-pack`
   - `https://www.japan2uk.com/products/pokemon-vstar-universe-s12a-high-class-japanese-booster-pack`
   If the handle is unknown, search the store (`site:japan2uk.com {set name} Japanese Booster Pack`) or browse the relevant collection. Prefer the **Japanese Booster Pack** URL, never the box or a regional reprint.
2. Pull the Shopify product JSON (append `.js` to the product URL). This is more reliable than scraping HTML:

   ```bash
   curl -sL 'https://www.japan2uk.com/products/<handle>.js'
   ```

   Use `featured_image` or the first entry in `images` / `media`. Shopify CDN paths may be protocol-relative (`//cdn.shopify.com/...`); prefix `https:`.
3. Download the PNG at native size (Japan2UK pack shots are typically 1400×1400 RGBA).
4. Resize to **512×512** to match every file in `boosters/` (macOS: `sips -Z 512 src.png --out boosters/{SETCODE}-{slug}.png`). Target size is ~300–400 KB.
5. Filename must be `{SETCODE}-{slug}.png` where `{SETCODE}-{slug}` is the same prefix used in `data-key`s (e.g. `S12a-vstar-universe.png` ↔ `S12a-vstar-universe-sell`). Overwrite in place when replacing art so the HTML `src` does not change.
6. Leave the global watermark mask in place. Do not strip the watermark from the PNG.

If the pack product has no image yet (pre-reveal), wait — do not substitute box art or fan renders. Exception: if the user supplies an official Japanese pack-product URL from another shop (e.g. japan-figure.com), download that shot, convert to 512×512 PNG, and add `class="booster-img no-watermark"` so the Japan2UK side-crop mask is not applied. Replace with Japan2UK art later if it appears.

### Add a new booster set

Do this on **both** `index.html` (public: sell + stock displays) and `admin.html` (buy + sell + stock inputs). Missing the admin card is a recurring bug: the public page shows the set but stock cannot be edited.

1. Grab pack art from Japan2UK as above into `boosters/{SETCODE}-{slug}.png`.
2. Duplicate an existing `<article class="card …">` in the matching TCG/era section. Card class is the era: `mega`, `sv`, `swsh`, or `op`. Place it in chronological order — **newest first** within that era. If the era section does not exist yet, copy a whole `<section class="era-section">` and add matching CSS (`.era-*` header + `.card.*` accent) to **both** HTML files.
3. Update: booster `alt`/`src`, logo `alt`/`src` + `tryNext()` fallback, `set-name`, `set-name-jp`, `set-code`, release date, and every `data-key`.
4. Set codes: keep this site's existing prefixes even when shops disagree (this repo already uses `MG6` for Abyss Eye while Japan2UK lists it as m5). Never reuse a prefix already in `data-key`s. Look up the Serebii card-list slug from `www.serebii.net/card/{slug}/` for the logo URL `https://www.serebii.net/card/logo/{slug}.png`.
5. Keep public and admin markup in sync except for the input row: public uses `.price-display`; admin uses `.price-input` (Buy ¥, Sell €, Stock).
6. No DB migration needed — new rows materialize the first time someone types in an admin input.

### Replace a booster image

1. Re-download from Japan2UK using the pack-product steps above.
2. Overwrite `boosters/{SETCODE}-{slug}.png` (keep the filename so the HTML stays in sync). Resize to 512×512.
3. If the new image has no watermark, you can either leave the mask (it still works, just crops more margin than necessary) or remove the `mask-image` rule for that specific image via a class modifier.

### Change theme colors

CSS custom properties live at the top of the `<style>` block:

```css
:root {
  --bg-deep:    #05050d;
  --neon-cyan:  #00f0ff;
  --neon-pink:  #ff2bd6;
  --neon-purple:#b537f2;
  ...
}
```

Updating these propagates everywhere via `var(--...)` references.

### Update the OG preview image

Regenerate `og-image.jpg` (1200×630, ideally < 300 KB). Reference any of the 32 boosters from `boosters/` as source material. The image is referenced from three `<meta>` tags in `<head>` — no URL changes needed since they use `__SITE_URL__`.

## Local dev

Serve the directory with any static server (Vercel preview, `npx serve`, `python -m http.server`, etc.). Without running `build.mjs`, the placeholders stay as literal strings — the page renders fine but Supabase calls fail with "Could not load prices". To exercise the sync layer locally:

```bash
SUPABASE_URL='...' SUPABASE_ANON_KEY='...' SITE_URL='http://localhost:4444' node build.mjs
# ...test...
git checkout index.html   # restore placeholders before committing
```

## Admin page testing

`admin.html` is gated by a Supabase Auth password login. A reusable test user is provisioned in the project's Supabase Auth so agents can exercise the edit flow end-to-end (load prices, edit an input, watch the debounced upsert, verify on reload).

Credentials live in the gitignored `.env` at the repo root (`ADMIN_TEST_EMAIL` / `ADMIN_TEST_PASSWORD`). The static site does **not** read `.env` itself — copy the values into the login form by hand (or via a browser automation tool) after running `build.mjs` with the Supabase env vars set.

Use this account only for local/preview verification, never for production data. Don't paste the credentials into committed files, logs, or chat transcripts that will be persisted.

## Deploy

- **Vercel (primary)**: pushes to `main` → automatic. Requires `SUPABASE_URL` and `SUPABASE_ANON_KEY` env vars set in the Vercel project. Optionally set `SITE_URL` for a custom domain.
- **GitHub Pages (backup)**: same flow via `.github/workflows/deploy.yml`. Requires repo secrets with the same names. Safe to delete once Vercel is the sole source of truth.

## Things to NOT do

- Don't commit substituted Supabase credentials (always revert `index.html` before committing).
- Don't rename `data-key`s without a Supabase migration — they're database primary keys.
- Don't introduce build tooling (Vite, webpack, etc.) — the single-file architecture is deliberate.
- Don't introduce frameworks. This stays plain HTML/CSS/JS.
- Don't remove the JAPAN2UK watermark mask without also replacing every booster image (or confirming none are watermarked).
- Don't add a set to `index.html` without the matching admin card (buy/sell/stock) in `admin.html`.
- Don't use Japan2UK box art, Korean listings, or non-pack product photos as the booster image.
