// Vercel build step: substitute env vars into index.html.
// Mirrors what .github/workflows/deploy.yml does, but via Node so the
// anon-key JWT (which contains characters meaningful to sed/sh) is
// substituted literally.
import fs from 'node:fs';

const must = (k) => {
  const v = process.env[k];
  if (!v) throw new Error(`Missing required env var: ${k}`);
  return v;
};

// Site URL for OG/Twitter card image absolute references.
// Priority: SITE_URL (custom domain) > VERCEL_PROJECT_PRODUCTION_URL (auto-set
// by Vercel for production builds) > localhost fallback (for local dev).
const siteUrl =
  process.env.SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:4444');

const file = 'index.html';
let html = fs.readFileSync(file, 'utf8');
html = html.replaceAll('__SUPABASE_URL__', must('SUPABASE_URL'));
html = html.replaceAll('__SUPABASE_ANON_KEY__', must('SUPABASE_ANON_KEY'));
html = html.replaceAll('__SITE_URL__', siteUrl.replace(/\/$/, ''));
fs.writeFileSync(file, html);
console.log(`Built ${file} (site URL: ${siteUrl})`);
