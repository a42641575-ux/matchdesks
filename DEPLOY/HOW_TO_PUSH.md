# HOW TO PUSH — MatchDesks deploy playbook

The canonical method for shipping changes to production. Read alongside
`PUSH_CHECKLIST.md` (the pre-flight gate).

---

## The repo

- **Local path:** `/Users/mehdiiarab/mapleboard` (folder name is legacy;
  the site/brand is **MatchDesks**, `matchdesks.com`)
- **Git remote:** `https://github.com/a42641575-ux/matchdesks.git` (the remote URL
  stays clean — the token is NEVER saved into `.git/config`, only used inline)
- **Owner account:** `a42641575-ux`
- **Branch:** `main` (Vercel watches this branch)
- **Commit author (global git config):** `mehdi iarab <mehdiiarab7@gmail.com>` —
  this is fine and intentional; the repo is public so Vercel accepts these commits
- **Deploy:** Vercel, auto-deploys on push to `main` (no CLI deploy needed)

## Why a plain `git push origin main` fails

The Mac's macOS keychain has a stored GitHub credential for the **`mehdiia`**
account. The repo belongs to **`a42641575-ux`**. A plain push sends the
keychain credential → GitHub sees the wrong account → `403 Permission denied`.

## The correct push command

Bypass the keychain, put a PAT in the URL:

```bash
cd /Users/mehdiiarab/mapleboard
git -c credential.helper= push "https://a42641575-ux:${TOKEN}@github.com/a42641575-ux/matchdesks.git" main
```

- `-c credential.helper=` → empty value = ignore keychain for this command only
- `${TOKEN}` → a GitHub PAT (classic, `repo` scope) from the `a42641575-ux` account,
  set as a shell variable in the current terminal session
- `main` → the branch Vercel watches

## Getting / setting the TOKEN

1. Sign in to GitHub as **`a42641575-ux`**
2. Settings → Developer settings → Personal access tokens → Tokens (classic)
3. Generate new token → scope: **`repo`** → copy it (starts `ghp_`, 40 chars)
4. In the terminal, **before** the push:
   ```bash
   TOKEN="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
   ```
5. Verify it works:
   ```bash
   curl -s -H "Authorization: token $TOKEN" https://api.github.com/user | grep login
   # must print: "login": "a42641575-ux"
   ```

> 🔴 **Never paste a token into chat.** It gets logged in the transcript.
> If one is ever shared in chat, treat it as compromised: revoke on GitHub,
> generate a fresh one.

## Full commit + push flow

```bash
cd /Users/mehdiiarab/mapleboard

# 1. (run the PUSH_CHECKLIST gate first — see PUSH_CHECKLIST.md)

# 2. Stage + commit
git add -A
git commit -m "Short imperative summary of the change"

# 3. Push with correct auth
TOKEN="ghp_xxx..."   # if not already set this session
git -c credential.helper= push "https://a42641575-ux:${TOKEN}@github.com/a42641575-ux/matchdesks.git" main

# 4. Confirm Vercel build goes green before walking away
```

---

## Environment variables (Vercel)

Set in: Vercel → MatchDesks → Settings → Environment Variables.
**Changing an env var requires a Redeploy** for it to take effect.

| Variable | Purpose | Required? |
|----------|---------|-----------|
| `DATABASE_URL` | Postgres connection (Neon in prod) | ✅ yes |
| `NEXT_PUBLIC_SITE_URL` | `https://matchdesks.com` — feeds canonical/sitemap/JSON-LD | ✅ yes |
| `ADMIN_SECRET` | Gates `/admin` moderation login (HMAC'd cookie) | ✅ yes |
| `CRON_SECRET` | Authorizes daily expiry cron (Vercel sends as Bearer) | ✅ yes (or cron is open) |
| `INDEXNOW_ADMIN_TOKEN` | Authorizes manual `POST /api/indexnow` batch submits | ✅ for the endpoint to work |
| `GOOGLE_INDEXING_SERVICE_ACCOUNT` | Full service-account JSON for Google Indexing API | optional (skips silently if unset) |
| `BREVO_API_KEY` | Transactional email | optional (skips silently if unset) |
| `CONTACT_FROM_EMAIL` | `hello@matchdesks.com` (Brevo-verified) | optional |
| `ADMIN_NOTIFY_EMAIL` | Your inbox for pending-job/fraud notifications | optional |
| `JOB_FEED_URL` | TOS-permissive JSON feed for `prisma/seed-feed.ts` | optional |

---

## Known recurring build-breakers (watch for these)

1. **ISR routes querying the DB at build time.** A route with
   `export const revalidate = N` but no `dynamic = 'force-dynamic'` gets
   prerendered during `next build` — which runs Prisma queries against the
   build environment's DB. If the DB/schema isn't reachable, the build dies
   with `The table 'public.Job' does not exist`.
   **Fix:** add `export const dynamic = 'force-dynamic'` to any route handler
   that hits the DB and doesn't need to be statically generated.

2. **Forgetting `DATABASE_URL` in a script.** Local scripts (`tsx ...`) read
   `.env`, but if you run them with a different env, Prisma throws
   `Environment variable not found: DATABASE_URL`.

3. **Drift between `prisma/schema.prisma` and the prod DB.** If you change the
   schema, you must `prisma migrate dev` (local) AND ensure the migration runs
   on prod (Neon) before deploying code that relies on the new fields.

---

## Triggering a Vercel redeploy without code changes

Sometimes you need Vercel to rebuild (e.g. after changing an env var) but have
no new commit. Two ways:

**Option A — empty commit (the method used historically):**
```bash
git commit --allow-empty -m "Trigger redeploy"
# then push with the token method
```

**Option B — Vercel dashboard (cleaner, no git pollution):**
Vercel → MatchDesks → Deployments → latest → ⋮ → **Redeploy**

Prefer Option B unless you specifically want a git-tracked redeploy trigger.

---

## Vercel + private repo gotcha (historical, resolved)

During the initial build, Vercel Hobby blocked deploys because the repo was
**private** and commits were authored by `mehdi iarab` (via the global git
config `mehdiiarab7@gmail.com`) while the Vercel project lived on the
`a42641575-ux` account.

**Fix that was applied (already done — repo is now public):**
1. Made the repo **public** via the GitHub API (`PATCH /repos/a42641575-ux/matchdesks`)
2. Pushed empty commit `79c6683` to trigger a clean redeploy
3. After that, commits authored as `mehdi iarab` deployed fine

If deploys ever silently fail again with an author/permission error, check
whether the repo got switched back to private.

---

## What the agent NEVER does (house rules)

- `git push --force` (never)
- `git config` changes (never — global config stays as `mehdi iarab`)
- `git commit --amend` (except the documented empty-commit redeploy case)
- Push without running the `PUSH_CHECKLIST.md` gate first
- Paste tokens into chat (if one appears, treat as compromised → revoke)
- Use `gh` CLI (not installed; not needed)
