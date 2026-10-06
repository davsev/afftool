# Mod Prompt Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task by task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the MVP from `docs/superpowers/specs/2026-10-06-mod-prompt-library-design.md`: a gallery of Claude Code mods where each mod has a copyable build prompt, with sign-up and mod submission.

**Architecture:** Next.js App Router, server components read from Supabase with the anon key under RLS. Mutations go through server actions using the user's session. Media goes to a Supabase Storage bucket. Mod pages are statically generated and revalidated on publish.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS v4, Framer Motion, Supabase (`@supabase/ssr`, Postgres, Auth, Storage), Zod, Vitest + Testing Library, Playwright, Vercel.

---

## File structure

```
app/
  layout.tsx                 fonts, theme, nav, footer
  page.tsx                   home: hero + featured + gallery
  mods/page.tsx              filtered gallery
  mods/[slug]/page.tsx       mod detail
  mods/[slug]/edit/page.tsx  edit own mod
  submit/page.tsx            submission form
  guide/page.tsx             prompt anatomy + starter template
  u/[handle]/page.tsx        public profile
  dashboard/page.tsx         my mods + likes
  admin/page.tsx             moderation queue
  login/page.tsx             auth
  auth/callback/route.ts     OAuth code exchange
  mods/[slug]/prompt.md/route.ts   .md download
  sitemap.ts, opengraph-image.tsx
components/
  ModCard.tsx  ModGrid.tsx  FilterBar.tsx  PromptBlock.tsx
  CopyButton.tsx  SurfaceChips.tsx  PreviewMedia.tsx  ModForm.tsx
lib/
  supabase/server.ts  supabase/client.ts  supabase/middleware.ts
  mods.ts            queries
  actions.ts         server actions (submit, update, like, moderate)
  schema.ts          Zod schemas + enums
  prompt-lint.ts     anatomy checker
  slug.ts
supabase/
  migrations/0001_init.sql
  seed.sql
tests/
  unit/*.test.ts
  e2e/*.spec.ts
middleware.ts
```

---

### Task 1: Scaffold

**Files:** create project root files.

- [ ] Step 1: `npx create-next-app@latest . --ts --tailwind --app --eslint --src-dir=false --import-alias "@/*"`
- [ ] Step 2: `npm i @supabase/supabase-js @supabase/ssr zod framer-motion` and `npm i -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom @playwright/test supabase`
- [ ] Step 3: add `vitest.config.ts` (environment `jsdom`, include `tests/unit/**`), scripts `test`, `test:e2e`, `typecheck: tsc --noEmit`.
- [ ] Step 4: `npm run build && npm test` pass on the empty app.
- [ ] Step 5: Commit `chore: scaffold next app`.

### Task 2: Shared schema and enums (TDD)

**Files:** create `lib/schema.ts`, `tests/unit/schema.test.ts`.

- [ ] Step 1: Write failing tests:

```ts
import { describe, it, expect } from 'vitest'
import { modInput } from '@/lib/schema'

const valid = {
  title: 'Token Weather', tagline: 'Forecast of your context window',
  categorySlug: 'context-tokens', surfaces: ['band'],
  promptMd: 'Build me a Claude Code mod called token-weather. '.repeat(3),
  reaches: ['none'], repoUrl: '', installCmd: '',
}

describe('modInput', () => {
  it('accepts a valid mod', () => expect(modInput.safeParse(valid).success).toBe(true))
  it('rejects unknown surface', () =>
    expect(modInput.safeParse({ ...valid, surfaces: ['popup'] }).success).toBe(false))
  it('rejects non github/gitlab repo', () =>
    expect(modInput.safeParse({ ...valid, repoUrl: 'https://evil.example/x' }).success).toBe(false))
  it('rejects tagline over 120 chars', () =>
    expect(modInput.safeParse({ ...valid, tagline: 'x'.repeat(121) }).success).toBe(false))
})
```

- [ ] Step 2: `npx vitest run tests/unit/schema.test.ts`, expect FAIL (module missing).
- [ ] Step 3: Implement:

```ts
import { z } from 'zod'

export const SURFACES = ['pane','band','status','toast','spinner','command','tool','guard','restyle'] as const
export const REACHES = ['files','network','processes','model','none'] as const

const repoUrl = z.string().url()
  .refine(u => /^https:\/\/(github\.com|gitlab\.com)\//.test(u), 'GitHub or GitLab only')

export const modInput = z.object({
  title: z.string().min(3).max(60),
  tagline: z.string().min(10).max(120),
  descriptionMd: z.string().max(5000).optional().default(''),
  categorySlug: z.string().min(1),
  surfaces: z.array(z.enum(SURFACES)).min(1),
  promptMd: z.string().min(80).max(20000),
  reaches: z.array(z.enum(REACHES)).min(1),
  repoUrl: z.union([repoUrl, z.literal('')]),
  installCmd: z.string().max(200)
    .regex(/^$|^(\/plugin|claude plugin) install [\w.-]+@[\w.-]+$/, 'Use /plugin install name@marketplace'),
  minCcVersion: z.string().regex(/^$|^\d+\.\d+\.\d+$/).optional().default(''),
})
export type ModInput = z.infer<typeof modInput>
```

- [ ] Step 4: Tests pass. Commit `feat: mod input schema`.

### Task 3: Prompt anatomy linter (TDD)

**Files:** create `lib/prompt-lint.ts`, `tests/unit/prompt-lint.test.ts`.

- [ ] Step 1: Failing tests: a prompt with all sections returns `[]`; a prompt missing `Where it shows:` and `Done when:` returns those two section names; matching is case-insensitive.
- [ ] Step 2: Run, expect FAIL.
- [ ] Step 3: Implement:

```ts
export const SECTIONS = ['What it does','Where it shows','Events to hook','State','Look','Limits','Done when'] as const
export function missingSections(prompt: string): string[] {
  const p = prompt.toLowerCase()
  return SECTIONS.filter(s => !p.includes(s.toLowerCase() + ':'))
}
```

- [ ] Step 4: Pass. Commit `feat: prompt anatomy linter`.

### Task 4: Slug helper (TDD)

**Files:** `lib/slug.ts`, `tests/unit/slug.test.ts`.

- [ ] Tests: `slugify('Token Weather!') === 'token-weather'`, collapses dashes, trims to 48 chars, `uniqueSlug('a', ['a','a-2']) === 'a-3'`.
- [ ] Implement, pass, commit `feat: slug helper`.

### Task 5: Database migration

**Files:** `supabase/migrations/0001_init.sql`.

- [ ] Step 1: `npx supabase init` then `npx supabase start` (needs Docker locally).
- [ ] Step 2: Write migration:

```sql
create type mod_status as enum ('draft','pending','published','rejected');

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  handle text unique not null check (handle ~ '^[a-z0-9_-]{2,30}$'),
  display_name text, avatar_url text, github_url text, bio text,
  role text not null default 'user' check (role in ('user','admin')),
  created_at timestamptz default now()
);

create table categories (id serial primary key, slug text unique not null, name text not null, sort_order int default 0);

create table mods (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  author_id uuid not null references profiles on delete cascade,
  title text not null, tagline text not null, description_md text default '',
  prompt_md text not null,
  category_id int references categories,
  surfaces text[] not null, reaches text[] not null,
  preview_url text, poster_url text, media_type text check (media_type in ('video','gif','image')),
  repo_url text, install_cmd text, min_cc_version text,
  status mod_status not null default 'pending', review_note text,
  is_featured boolean default false, is_premium boolean default false,
  copy_count int default 0, like_count int default 0,
  created_at timestamptz default now(), updated_at timestamptz default now(), published_at timestamptz
);
create index on mods (status, published_at desc);
create index on mods using gin (surfaces);
alter table mods add column fts tsvector generated always as
  (to_tsvector('english', title || ' ' || tagline || ' ' || coalesce(description_md,''))) stored;
create index on mods using gin (fts);

create table likes (user_id uuid references profiles on delete cascade, mod_id uuid references mods on delete cascade,
  created_at timestamptz default now(), primary key (user_id, mod_id));

create table copy_events (id bigserial primary key, mod_id uuid references mods on delete cascade,
  user_id uuid, kind text check (kind in ('copy','download')), created_at timestamptz default now());

create function is_admin() returns boolean language sql stable security definer as
  $$ select exists(select 1 from profiles where id = auth.uid() and role = 'admin') $$;

alter table profiles enable row level security;
alter table mods enable row level security;
alter table likes enable row level security;
alter table copy_events enable row level security;
alter table categories enable row level security;

create policy "profiles readable" on profiles for select using (true);
create policy "own profile" on profiles for update using (id = auth.uid());
create policy "categories readable" on categories for select using (true);

create policy "published or own or admin" on mods for select
  using (status = 'published' or author_id = auth.uid() or is_admin());
create policy "author inserts pending" on mods for insert
  with check (author_id = auth.uid() and status in ('draft','pending') and not is_featured);
create policy "author edits unpublished" on mods for update
  using (author_id = auth.uid() and status <> 'published')
  with check (author_id = auth.uid() and status in ('draft','pending') and not is_featured);
create policy "admin all" on mods for all using (is_admin()) with check (is_admin());

create policy "likes readable" on likes for select using (true);
create policy "own likes" on likes for insert with check (user_id = auth.uid());
create policy "own unlike" on likes for delete using (user_id = auth.uid());

create function track_copy(p_mod uuid, p_kind text) returns void language plpgsql security definer as $$
begin
  insert into copy_events(mod_id, user_id, kind) values (p_mod, auth.uid(), p_kind);
  update mods set copy_count = copy_count + 1 where id = p_mod and status = 'published';
end $$;

-- profile row on signup, handle from GitHub username or email prefix
create function handle_new_user() returns trigger language plpgsql security definer as $$
begin
  insert into profiles(id, handle, display_name, avatar_url)
  values (new.id,
    lower(regexp_replace(coalesce(new.raw_user_meta_data->>'user_name', split_part(new.email,'@',1)), '[^a-z0-9_-]', '', 'gi'))
      || '-' || substr(new.id::text,1,4),
    new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

-- like_count kept in sync
create function sync_like_count() returns trigger language plpgsql security definer as $$
begin
  update mods set like_count = (select count(*) from likes where mod_id = coalesce(new.mod_id, old.mod_id))
  where id = coalesce(new.mod_id, old.mod_id);
  return null;
end $$;
create trigger likes_count after insert or delete on likes for each row execute function sync_like_count();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('previews','previews', true, 26214400,
  array['video/mp4','video/webm','image/gif','image/png','image/jpeg','image/webp']);
create policy "upload own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'previews' and (storage.foldername(name))[1] = auth.uid()::text);
```

- [ ] Step 3: `npx supabase db reset` applies cleanly.
- [ ] Step 4: Add `tests/db/rls.sql` (pgTAP via `supabase test db`): anon cannot see pending mods; author cannot set `status='published'`; non-admin cannot set `is_featured`. Run `npx supabase test db`, expect pass.
- [ ] Step 5: Commit `feat: database schema with RLS`.

### Task 6: Supabase clients and auth

**Files:** `lib/supabase/{server,client,middleware}.ts`, `middleware.ts`, `app/login/page.tsx`, `app/auth/callback/route.ts`.

- [ ] Step 1: Server and browser clients per `@supabase/ssr` docs (cookie-based session).
- [ ] Step 2: `middleware.ts` refreshes the session; redirects unauthenticated users from `/submit`, `/dashboard`, `/admin` to `/login?next=...`.
- [ ] Step 3: Login page: "Continue with GitHub" (primary), Google, email magic link.
- [ ] Step 4: Enable GitHub and Google providers in Supabase dashboard; set redirect `https://<domain>/auth/callback`.
- [ ] Step 5: E2E `tests/e2e/auth.spec.ts`: visiting `/submit` signed out redirects to `/login`.
- [ ] Step 6: Commit `feat: auth`.

### Task 7: Seed data

**Files:** `supabase/seed.sql`, `content/seed-mods/*.md`.

- [ ] Step 1: Insert the 8 categories from the spec.
- [ ] Step 2: Write 12 seed prompts following the anatomy, our own wording. Ideas: context fuel gauge band, tool-call counter spinner, rm -rf guard with diff preview, CI status pane, cost-per-turn status line, focus timer band, "explain this edit" command, TODO harvester pane, git branch weather, test runner pane, quiet-hours guard, prompt history search command.
- [ ] Step 3: Build each one in Claude Code with its own prompt; fix the prompt until the result works first try. Record a 6-10s preview (VHS or screen capture, 1280x800, mp4 + poster png).
- [ ] Step 4: Seed author profile "modprompts" with role admin. Commit `feat: seed mods`.

### Task 8: Queries

**Files:** `lib/mods.ts`, `tests/unit/mods.test.ts`.

- [ ] Functions: `listMods({ surface?, category?, q?, sort: 'new'|'popular', page })`, `getModBySlug(slug)`, `listFeatured()`, `listByAuthor(handle)`, `listPending()`.
- [ ] Unit test the filter builder (pure function that turns params into a query description) so it can run without a DB.
- [ ] Commit `feat: mod queries`.

### Task 9: Design system and layout

**Files:** `app/layout.tsx`, `app/globals.css`, `components/Nav.tsx`, `components/Footer.tsx`.

- [ ] Step 1: Grab 5-6 screenshots of motionsites.ai into `docs/design/refs/` and match spacing and type scale.
- [ ] Step 2: Tailwind v4 `@theme` tokens: `--color-bg #0A0A0B`, `--color-fg #F5F3EF`, `--color-muted #8A8A90`, `--color-accent #FF6A3D`, `--color-line #1F1F23`; fonts Instrument Serif, Inter, JetBrains Mono via `next/font`.
- [ ] Step 3: Nav (logo text, Browse, Guide, Submit, avatar/Sign in). Footer with "Independent community project, not affiliated with Anthropic."
- [ ] Step 4: Commit `feat: design tokens and layout`.

### Task 10: Card, grid, filters

**Files:** `components/{PreviewMedia,ModCard,ModGrid,FilterBar,SurfaceChips,CopyButton}.tsx`, `tests/unit/CopyButton.test.tsx`.

- [ ] Step 1: Failing test: clicking `CopyButton` writes the text to `navigator.clipboard`, shows "Copied", and calls `onCopied`.
- [ ] Step 2: Implement `CopyButton`, pass.
- [ ] Step 3: `PreviewMedia`: `<video muted loop playsInline preload="none" poster>`; plays on hover (desktop) or when 60% in view (IntersectionObserver, mobile); static poster when `prefers-reduced-motion`.
- [ ] Step 4: `ModCard`: 16:10 media, title, tagline, surface chips, copy-prompt icon (calls `track_copy`).
- [ ] Step 5: `ModGrid` with Framer Motion staggered fade-up; `FilterBar` pills for surfaces + category select + search input, synced to URL params.
- [ ] Step 6: Commit `feat: gallery components`.

### Task 11: Home and browse pages

**Files:** `app/page.tsx`, `app/mods/page.tsx`.

- [ ] Home: hero ("Prompts that build Claude Code mods", subline, two CTAs: Browse, Submit), gradient glow, featured row, then grid of newest.
- [ ] `/mods`: FilterBar + grid + "Load more". Empty state links to `/submit`.
- [ ] E2E: home shows at least 12 cards from seed; clicking the `pane` pill updates URL and filters.
- [ ] Commit `feat: home and browse`.

### Task 12: Mod detail, copy and download

**Files:** `app/mods/[slug]/page.tsx`, `components/PromptBlock.tsx`, `app/mods/[slug]/prompt.md/route.ts`.

- [ ] Page: large preview, title, author chip, surfaces, `reaches` chips, description, PromptBlock (mono, terminal frame, sticky Copy + Download .md), optional install block, safety note ("Read the code Claude writes. Run `claude plugin validate ./<mod>` before keeping it."), "How to use" link to `/guide`, related mods.
- [ ] `prompt.md` route returns `text/markdown` with `Content-Disposition: attachment; filename="<slug>.md"`, calls `track_copy(id,'download')`.
- [ ] `generateStaticParams` for published mods, `revalidate` tag `mod:<slug>`.
- [ ] E2E: copy button puts prompt on clipboard; download returns 200 and markdown body.
- [ ] Commit `feat: mod detail page`.

### Task 13: Submit and edit

**Files:** `app/submit/page.tsx`, `app/mods/[slug]/edit/page.tsx`, `components/ModForm.tsx`, `lib/actions.ts`, `tests/unit/actions.test.ts`.

- [ ] Step 1: Failing test for `submitMod` with a mocked Supabase client: invalid input returns field errors; valid input inserts with `status:'pending'` and a unique slug; 6th submission in 24h returns rate-limit error.
- [ ] Step 2: Implement `submitMod`, `updateMod` (allowed only when not published), pass.
- [ ] Step 3: `ModForm`: fields from schema, prompt textarea prefilled with the anatomy template, live `missingSections` warnings, media upload direct to Storage `previews/{uid}/...` with progress, live `ModCard` preview on the side.
- [ ] Step 4: After submit, redirect to `/dashboard` with "Pending review" toast.
- [ ] Commit `feat: submit and edit mods`.

### Task 14: Likes, profile, dashboard

**Files:** `components/LikeButton.tsx`, `app/u/[handle]/page.tsx`, `app/dashboard/page.tsx`.

- [ ] Like toggles via server action (optimistic). Signed-out click sends to `/login`.
- [ ] Profile: avatar, bio, GitHub link, published mods grid.
- [ ] Dashboard: my mods with status badges and review notes, edit links, liked mods.
- [ ] Commit `feat: likes, profiles, dashboard`.

### Task 15: Moderation

**Files:** `app/admin/page.tsx`, `lib/actions.ts` (`moderateMod`).

- [ ] Admin-only (check `is_admin` server-side, 404 otherwise).
- [ ] Queue of pending mods: preview, full prompt, repo link, Approve / Reject (note required) / Feature toggle.
- [ ] Approve sets `published`, `published_at`, calls `revalidateTag('mod:<slug>')` and `revalidatePath('/')`.
- [ ] Review checklist shown in UI: no exfiltration, no disabling permission prompts, no hidden behavior, preview matches prompt.
- [ ] Unit test: non-admin call to `moderateMod` throws.
- [ ] Commit `feat: moderation queue`.

### Task 16: Guide page

**Files:** `app/guide/page.tsx`.

- [ ] Sections: what a mod is (link to official docs), how to use a prompt (open Claude Code v2.1.287+, paste, Claude uses `plugin-authoring`, `/reload-plugins`), prompt anatomy with the template and Copy, how to record a preview, safety.
- [ ] Commit `feat: guide`.

### Task 17: SEO and polish

- [ ] `sitemap.ts`, `robots.ts`, per-mod `generateMetadata`, `opengraph-image.tsx` (title + poster).
- [ ] Lighthouse mobile: performance >= 85, accessibility >= 95. Fix what fails.
- [ ] Check layout at 375px, no horizontal scroll.
- [ ] Commit `chore: seo and polish`.

### Task 18: Deploy

- [ ] Create Supabase project, `npx supabase link`, `npx supabase db push`, run seed.
- [ ] Vercel project, env `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server only, used for nothing in v1 unless needed).
- [ ] GitHub Action: `npm run typecheck && npm test && npm run build` on PR; Playwright on preview URL.
- [ ] Set production OAuth redirect URLs. Smoke test sign-in, submit, approve, copy.
- [ ] Commit `chore: ci and deploy config`.

---

## Self-review

- Spec coverage: gallery (T10-11), detail + copy/download (T12), auth (T6), submit (T13), likes/profile (T14), moderation (T15), guide (T16), SEO (T17), safety note (T12, T15), seed content (T7). Prompt variables, remix, premium are v2 and intentionally absent.
- Types used across tasks: `ModInput` (T2) feeds `ModForm` and `submitMod` (T13); `SURFACES` drives `FilterBar` (T10) and DB `surfaces` column (T5).

## Implementation notes (2026-10-06)

Tasks 1-17 are built on branch `mod-prompt-library-plan`. Deviations from the plan:

- Demo mode: with no Supabase env vars the site runs on `content/seed-mods.ts`, so it can be previewed and tested without a backend.
- Database tests run the real migration in PGlite with a small Supabase stub (`tests/db/supabase-stub.sql`) instead of pgTAP, so no Docker is needed.
- Card motion uses CSS keyframes instead of Framer Motion (one less dependency, same effect).
- Seed previews are drawn by `TerminalMock` (an animated terminal frame per mod) until real recordings exist. Recording real previews from Task 7 step 3 is still open.
- Nav user state and the like button load in the browser so public pages stay static.

Still open: Task 18 (create the Supabase project, Vercel deploy, OAuth apps), real preview recordings, and per-IP rate limiting on `track_copy`.
