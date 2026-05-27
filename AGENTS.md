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
boosters/               32 PNGs, one per booster set. Filename = data-key prefix.
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

### Add a new booster set

1. Download a clean (or watermarked-by-japan2uk) booster image to `boosters/{SETCODE}-{slug}.png`.
2. Duplicate an existing `<article class="card sv">` (or `mega`) block in `index.html`. Place it in the correct chronological position — newest first within each era.
3. Update: `alt`, `src` (booster + logo), `set-name`, `set-name-jp`, `set-code`, release date, and all three `data-key`s on the inputs.
4. No DB migration needed — new rows materialize the first time someone types in an input.

### Replace a booster image

1. Drop the new file at `boosters/{SETCODE}-{slug}.png` (keep the filename so the HTML stays in sync).
2. If the new image has no watermark, you can either leave the mask (it still works, just crops more margin than necessary) or remove the `mask-image` rule for that specific image via a class modifier.

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

## Deploy

- **Vercel (primary)**: pushes to `main` → automatic. Requires `SUPABASE_URL` and `SUPABASE_ANON_KEY` env vars set in the Vercel project. Optionally set `SITE_URL` for a custom domain.
- **GitHub Pages (backup)**: same flow via `.github/workflows/deploy.yml`. Requires repo secrets with the same names. Safe to delete once Vercel is the sole source of truth.

## Things to NOT do

- Don't commit substituted Supabase credentials (always revert `index.html` before committing).
- Don't rename `data-key`s without a Supabase migration — they're database primary keys.
- Don't introduce build tooling (Vite, webpack, etc.) — the single-file architecture is deliberate.
- Don't introduce frameworks. This stays plain HTML/CSS/JS.
- Don't remove the JAPAN2UK watermark mask without also replacing all 32 booster images.
