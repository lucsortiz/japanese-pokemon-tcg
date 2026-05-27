// Vercel build step: substitute Supabase env vars into index.html.
// Mirrors what .github/workflows/deploy.yml does, but via Node so the
// anon-key JWT (which contains characters meaningful to sed/sh) is
// substituted literally.
import fs from 'node:fs';

const must = (k) => {
  const v = process.env[k];
  if (!v) throw new Error(`Missing required env var: ${k}`);
  return v;
};

const file = 'index.html';
let html = fs.readFileSync(file, 'utf8');
html = html.replaceAll('__SUPABASE_URL__', must('SUPABASE_URL'));
html = html.replaceAll('__SUPABASE_ANON_KEY__', must('SUPABASE_ANON_KEY'));
fs.writeFileSync(file, html);
console.log(`Injected Supabase credentials into ${file}`);
