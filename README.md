# Modprompts

A gallery of Claude Code mods where every mod comes with a prompt you paste into Claude Code to build it yourself.

- Spec: `docs/superpowers/specs/2026-10-06-mod-prompt-library-design.md`
- Plan: `docs/superpowers/plans/2026-10-06-mod-prompt-library.md`

## Run locally

```bash
npm install
npm run dev
```

Without Supabase env vars the site runs in demo mode on the 12 seed mods in `content/seed-mods.ts`. Browsing, copying and downloading prompts work; sign-in and submissions are off.

## Connect Supabase

1. Create a Supabase project.
2. Apply the schema: `npx supabase link --project-ref <ref>` then `npx supabase db push`, or paste `supabase/migrations/0001_init.sql` into the SQL editor.
3. Load seed mods: run `supabase/seed.sql` in the SQL editor (regenerate it with `npm run seed:sql` after editing seeds).
4. Auth: enable GitHub and Google providers, add `https://<your-domain>/auth/callback` to the redirect URLs.
5. Copy `.env.example` to `.env.local` and fill in the URL and anon key.
6. Make yourself admin: `update profiles set role = 'admin' where handle = '<your-handle>';`

## Tests

```bash
npm test          # unit + database rules (PGlite, no Docker needed)
npm run test:e2e  # Playwright against a production build (run npm run build first)
```

In environments with a preinstalled Chromium, set `PW_CHROMIUM_PATH` to its binary.

## Deploy

Vercel: import the repo, set the three env vars from `.env.example`. Mod pages are static and revalidate every 5 minutes or on moderation.
