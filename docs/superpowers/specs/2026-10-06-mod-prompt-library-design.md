# Mod Prompt Library: Design Spec

Date: 2026-10-06
Status: Draft for review
Working name: **Modprompts** (placeholder, domain TBD)

## 1. Idea in one line

A dark, motion-heavy gallery of Claude Code mods where every mod ships with a
ready-to-paste prompt that makes your own Claude build it. Think motionsites.ai,
but for Claude Code mods instead of landing-page heroes.

## 2. Research findings

### What a mod is

- Claude Code mods went GA around Oct 1, 2026 (CLI v2.1.287+, Desktop v2.1.286+).
- A mod is a plugin whose `hooks/hooks.json` points to a JS/TS module that
  exports `register(on, options)`. Hooks have the shape `($, e, next)`.
- Surfaces a mod can draw or change: pane beside the transcript, band above the
  prompt, status line, toasts, spinner suffix, restyled tool rows, slash
  commands, model-callable tools, tool-call guards, per-turn rewrites.
- Install: `/plugin install <mod>@<marketplace>` or
  `claude plugin install <mod>@<marketplace>`.
- Build: the official path is "describe what you want and Claude writes the
  mod" via the built-in `plugin-authoring` skill. **This is the hook for our
  product: a good prompt is the whole recipe.**
- Mods run unsandboxed with the user's permissions. `claude plugin validate`
  lists hooks and calls before install.
- Official samples: `token-weather`, `blast-radius`, `replay-theater`
  (anthropics/claude-code-playground).

### Competitors (all launched in the last week)

| Site | Model | Gap |
|---|---|---|
| mods.aidojo.si (awesome-claude-code-mods) | Auto-scanned GitHub list, ~1,745 mods, permission scan | Raw list, no inspiration, no prompts |
| claudemods.ai | Voted catalog, ~45 mods, 9 categories | Install-only |
| claudemods.dev | Directory, ~571 projects | Install-only |
| claudemod.com | Community share, mods + skills + MCP | Install-only |
| claudemods.chat | Reviewed, pinned commits | Install-only |

None of them lead with **prompts**. Everyone answers "where do I install X".
Nobody answers "how do I get my Claude to build something like X, my way".

### Design reference: motionsites.ai

- Prompt library, not a builder. ~364 prompts, free tier with "Copy", paid unlock.
- Homepage is a gallery of animated previews. Card = looping video + title +
  copy button. Dark theme, big display type, premium feel.
- Prompt pages spell out stack, motion, typography, states in detail.

(Note: the site itself is blocked from this environment's network, so the
visual notes come from reviews and descriptions. Before building the UI,
open motionsites.ai and save 5-6 screenshots to `docs/design/refs/`.)

## 3. Decisions (from brainstorming)

1. Angle: prompt library first. Install command is secondary and optional.
2. Language: English.
3. Business model: free for now. Keep a `premium` flag in the schema for later.
4. Stack: Next.js (App Router) + Supabase (Auth, Postgres, Storage), deploy on Vercel.

## 4. Users and core flows

**Visitor (no account)**
1. Lands on home, sees a wall of looping mod previews.
2. Filters by surface (pane, band, status line, guard, command...) or category.
3. Opens a mod: big preview, what it does, the prompt.
4. Clicks **Copy prompt** or **Download .md**, pastes into Claude Code.

**Creator (signed in)**
1. Signs in with GitHub (primary) or Google / email magic link.
2. Clicks **Submit a mod**: title, tagline, category, surfaces, preview video
   or GIF, the prompt, optional repo URL + marketplace install string.
3. Sees a live preview of the card, submits. Status: `pending`.
4. Gets notified when approved. Mod appears on their public profile `/u/handle`.

**Admin**
1. Reviews pending queue at `/admin`, approves or rejects with a note.

## 5. Scope

### MVP (v1)

- Home gallery with hover-to-play previews, filters, search.
- Mod detail page with prompt block, copy, download `.md`, copy count.
- "Prompt anatomy" guide page + a free starter template prompt.
- Auth (GitHub, Google, magic link), user profile, my-mods dashboard.
- Submit / edit mod, media upload, moderation queue.
- Likes (saves) on mods.
- 12 seed mods written by us (own prompts, own previews).
- SEO: static mod pages, OG images, sitemap.

### Later (v2+)

- Prompt variables: fill `{{accent_color}}`, `{{refresh_seconds}}` in a form,
  get a customized prompt.
- "Remix" a mod: fork its prompt into your own submission, credit the original.
- Comments, collections, weekly "featured" email.
- Premium prompts / paid tier (schema flag already exists).
- Auto permission scan of linked repos (like aidojo) via `claude plugin validate` in CI.

### Out of scope

- Hosting mod code or running a plugin marketplace ourselves.
- Executing or testing user mods on our servers.

## 6. Data model (Supabase Postgres)

```
profiles      id (uuid = auth.users.id), handle (unique), display_name,
              avatar_url, github_url, bio, role ('user'|'admin'), created_at

categories    id, slug, name, sort_order
              seed: productivity, monitoring, safety, fun-games, git-ci,
                    context-tokens, ui-themes, workflow

mods          id, slug (unique), author_id -> profiles,
              title, tagline (<=120), description_md,
              prompt_md (the build prompt), 
              category_id -> categories,
              surfaces text[]  -- pane|band|status|toast|spinner|command|tool|guard|restyle
              preview_url, poster_url, media_type ('video'|'gif'|'image'),
              repo_url (nullable), install_cmd (nullable),
              min_cc_version (nullable),
              reaches text[]   -- files|network|processes|model|none (author-declared)
              status ('draft'|'pending'|'published'|'rejected'),
              review_note, is_featured bool, is_premium bool default false,
              copy_count int default 0, like_count int default 0,
              created_at, updated_at, published_at

likes         user_id, mod_id, created_at  (pk user_id+mod_id)

copy_events   id, mod_id, user_id nullable, kind ('copy'|'download'), created_at
```

RLS:
- `mods`: anyone reads `published`. Author reads/updates own rows while
  status is `draft|pending|rejected`. Only admin sets `published`/`rejected`/`is_featured`.
- `likes`: user inserts/deletes own.
- `copy_events`: insert via RPC `track_copy(mod_id, kind)` that also increments
  `copy_count` (security definer, rate limited per IP hash).
- Storage bucket `previews`: authenticated upload to `previews/{user_id}/...`,
  max 25 MB, mime `video/mp4|video/webm|image/gif|image/png|image/jpeg|image/webp`.

## 7. Pages

| Route | Purpose |
|---|---|
| `/` | Hero + featured strip + full gallery grid with filters |
| `/mods?surface=pane&category=safety&q=` | Filterable gallery (same grid) |
| `/mods/[slug]` | Detail: preview, what it does, surfaces, prompt, copy/download, install (if any), author, related |
| `/guide` | How to use a prompt in Claude Code, prompt anatomy, starter template |
| `/submit`, `/mods/[slug]/edit` | Submission form with live card preview |
| `/u/[handle]` | Public profile and their mods |
| `/dashboard` | My mods with status, my likes |
| `/admin` | Moderation queue |
| `/login` | Supabase auth |

## 8. Prompt format (what makes this site useful)

Every prompt follows one anatomy so quality is consistent:

```
Build me a Claude Code mod called <name>.

What it does: <one paragraph, user-visible behavior>
Where it shows: <pane | band above prompt | status line | toast | command ...>
Events to hook: <e.g. tool.call, ui.render {component:'Spinner'}, turn.end>
State: <what it remembers between hooks>
Look: <layout, colors, refresh rate, empty state>
Commands: </name args -> behavior>
Limits: <what it must not do: no network, no file writes outside X>
Done when: <how I check it works, plus a test with the mods test kit>

Use the plugin-authoring skill. Put it in ./<name>/ as a plugin with
.claude-plugin/plugin.json, hooks/hooks.json and hooks/register.ts,
then load it with /reload-plugins.
```

The submit form shows this anatomy as placeholder text and lints for missing
sections (soft warning, not a block).

## 9. Visual design direction

- Near-black background (`#0A0A0B`), off-white text, one warm accent
  (coral `#FF6A3D`) plus a soft gradient glow behind the hero. Do **not** use
  Anthropic's logo or wordmark; footer says "Independent community project,
  not affiliated with Anthropic."
- Type: large display serif or tight grotesk for headings (e.g. "Instrument
  Serif" + "Inter"), mono (`JetBrains Mono`) for prompts and commands.
- Cards: 16:10 looping muted video, plays on hover (autoplay in view on
  mobile), rounded 16px, thin 1px border, title + surface chips + copy icon.
- Motion: staggered fade-up on grid, subtle parallax on hero, Framer Motion.
  Respect `prefers-reduced-motion`.
- Prompt block: mono, terminal-styled frame, sticky Copy / Download bar.
- Mobile-first grid: 1 col < 640px, 2 cols < 1024px, 3 cols above.

## 10. Trust and safety

- Prompts are text, but they produce code that runs with the user's
  permissions. Every mod page shows: "Read the code Claude writes. Run
  `claude plugin validate ./<mod>` before keeping it."
- Author declares `reaches` (files, network, processes, model). Shown as chips.
- Moderation before publish. Reject prompts that ask Claude to exfiltrate
  data, disable permission prompts, or hide behavior.
- Repo URLs restricted to `github.com` and `gitlab.com` in v1.
- Rate limit submissions (5/day/user) and copy tracking.

## 11. Metrics

- Copies + downloads per mod (core success signal).
- Submissions per week, approval rate.
- Sign-up conversion from mod pages.

## 12. Risks

- Crowded space, 5 catalogs in one week. Mitigation: prompts are the product,
  quality over count, strong visuals.
- Empty site at launch. Mitigation: 12 seed mods with real recorded previews.
- Preview videos are work for creators. Mitigation: accept GIF/PNG, give a
  "how to record a 10s preview" guide (asciinema/VHS for terminal).
- Mods API may change fast. Mitigation: `min_cc_version` field, "tested with"
  badge, easy edit.
