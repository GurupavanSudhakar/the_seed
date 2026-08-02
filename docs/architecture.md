# Architecture — The Seed Chronicles (multi-user version)

This supersedes the original "single self-contained HTML file" plan for `seed_chronicles.html`. The game is moving from a single portable file to a small multi-file static site backed by Supabase, so that progress is tied to a real account (not a browser/device), and so a fixed, invite-only set of accounts can play.

This is also an explicit learning project — prefer clear, understandable pieces (real SQL, real auth, a couple of small serverless functions) over adding an abstraction layer/framework to hide them.

## Why this shift

- **Per-account, cross-device progress** requires a real backend — `localStorage` only persists per-browser/device.
- **A capped, invite-only set of players** (you + your girlfriend, no open signup) requires real accounts, since there's no "max N accounts" setting on any auth provider — it has to be enforced with an invite-code table.
- Splitting into multiple files removes the earlier "one file to share by email" motivation entirely, since the site is hosted (Vercel) rather than passed around as a raw `.html` file — a single 700KB+ file with inlined base64 images was already becoming awkward to edit.

## High-level stack

- **Frontend**: plain multi-file static site — HTML/CSS/JS, no framework, no build step. Same screen-based state-machine pattern as `docs/valentine.html` (`clearScreens()` / `showScreen()` / `showOverlay()` / `addRestartBtn()`), just split across files instead of one.
- **Auth + database**: Supabase (Postgres + built-in Auth), free tier.
- **Backend logic**: a couple of small Vercel serverless functions (Node), used only where the client can't be trusted to do something itself (validating/consuming an invite code, creating an account). Everything else talks to Supabase directly from the client using the public anon key + Row Level Security.
- **Hosting**: Vercel free tier, deployed via the `vercel` CLI (`npx vercel`), private GitHub repo (`GurupavanSudhakar/the_seed`).

## Frontend file layout (proposed)

```
/public
  index.html          — title screen (was the top of seed_chronicles.html)
  login.html          — email/password login
  signup.html         — invite-code-gated account creation
  chapter1.html ... chapter7.html
  credits.html
  /css
    shared.css         — reset, screen/.active system, shared tokens (:root vars)
    chapter-themes.css  — per-chapter palette overrides (Ch1 meadow, Ch2 desert, ...)
  /js
    shared.js          — clearScreens/showScreen/showOverlay/addRestartBtn, ambient fx helpers
    supabase-client.js  — Supabase client init (URL + anon key), save/load progress helpers
    auth.js             — login/signup form handling, calls /api/signup for invite redemption
    chapter1.js ... chapter7.js — per-chapter narration + mini-game logic
  /assets
    /title, /ch1-meadow ... /ch7-battle, /credits, /shared
    (real image files, one subfolder per screen — no more base64 inlining)
/api
  signup.js            — serverless function: validate + consume invite code, create user
```

Chapters stay data-driven off `docs/The_Seed_Chronicles.md` and the chapter specs in `docs/plan.txt` — this doc only changes *where the code lives and how progress/accounts work*, not the story/mini-game content plan.

### Asset library convention

`public/assets/` is organized one subfolder per screen (`title/`, `ch1-meadow/` ... `ch7-battle/`, `credits/`) rather than one flat folder, since 7 chapters' worth of backgrounds/character-sprite states/UI art would get unwieldy otherwise. `shared/` holds cross-chapter reusable art (e.g. the seed character sprite states as it evolves across the story, per `plan.txt`'s "seed evolves visually across chapters" note) rather than duplicating the same asset into every chapter folder that uses it. Empty folders carry a `.gitkeep` so the structure is visible in the repo before art exists for that chapter.

## Data model (Supabase / Postgres)

```sql
-- Invite-gated signup: a fixed pool of codes, one use each.
create table invite_codes (
  code text primary key,
  used boolean not null default false,
  used_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- Per-user save state. auth.users is managed by Supabase Auth already.
create table game_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_chapter int not null default 1,
  chapter_state jsonb not null default '{}',
  updated_at timestamptz not null default now()
);
```

**Row Level Security (RLS)**:
- `game_progress`: enabled, with a policy so a user can only `select`/`insert`/`update` the row where `user_id = auth.uid()`. This is the actual mechanism that makes "per-account, isolated progress" hold — not app code.
- `invite_codes`: RLS enabled with **no** client-facing policies at all — the table is only ever touched by the serverless function using the Supabase **service role key** (server-side secret, never shipped to the browser). The anon/client key can't read or write it.

## Account creation flow (invite codes)

Real signup can't be a plain client-side `supabase.auth.signUp()` call, because nothing would stop someone from calling that directly and skipping the invite check. Instead:

1. Client (`signup.html` / `auth.js`) posts `{ email, password, inviteCode }` to `/api/signup` (Vercel serverless function).
2. The function, using the Supabase **service role key** (env var, server-only), atomically claims the code:
   ```sql
   update invite_codes set used = true
   where code = $1 and used = false
   returning code;
   ```
   If zero rows come back, the code was invalid or already used — reject the request before creating any account.
3. On success, the function creates the user via Supabase's Admin API, then updates `invite_codes.used_by` with the new user's id, then inserts a starting row into `game_progress`.
4. Client then signs the new user in normally via `supabase.auth.signInWithPassword()`.

Login (existing users) is a normal client-side Supabase Auth call — no serverless function involved.

## Progress save/load

- On chapter transitions / mini-game completion, the client calls Supabase directly (`supabase.from('game_progress').update(...)`) using the logged-in user's session — RLS ensures this only ever touches their own row.
- On load, fetch `game_progress` for the current session; if none, start at Chapter 1.

## Environment variables

- `SUPABASE_URL`, `SUPABASE_ANON_KEY` — public, safe to embed client-side (RLS is what actually protects data, not secrecy of these).
- `SUPABASE_SERVICE_ROLE_KEY` — secret, set only as a Vercel serverless environment variable, never committed or sent to the browser. Used exclusively inside `/api/signup.js`.

## Open questions / next steps

- How many invite codes to seed initially (2, presumably — you + her — plus maybe a spare).
- Whether `chapter_state` (jsonb) needs real structure now or can stay a loose bag of per-chapter flags until chapters are built.
- Whether login/signup screens should match the Zelda-BOTW-styled title screen or be treated as plain utility screens.
- Migrating the existing title-screen work in `seed_chronicles.html` into `public/index.html` under the new file layout.
