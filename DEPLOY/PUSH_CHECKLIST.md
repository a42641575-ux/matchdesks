# PUSH CHECKLIST — read before EVERY commit/push

> This file exists because a build failure shipped to production on 2026-07-07
> that should have been caught locally. Cost real time. It won't happen again.
> **If you are about to `git add` / `git commit` / `git push`, stop and run every
> box below. No exceptions, no "it's a tiny change, it'll be fine."**

---

## 1. Typecheck passes locally

```bash
cd /Users/mehdiiarab/mapleboard && npx tsc --noEmit
```
- Exit code `0` and **zero output** = ✅ proceed
- Any error output = ❌ FIX FIRST. Do not commit.

## 2. Production build passes locally

This is the one that caught us out. A clean `tsc` does NOT prove the Next.js
build works — Vercel runs `next build`, which prerenders pages, hits the DB at
build time for ISR routes, validates env vars, etc. Run it:

```bash
cd /Users/mehdiiarab/mapleboard && rm -rf .next && npm run build
```

- Ends with `✓ Compiled successfully` + `✓ Generating static pages` = ✅ proceed
- Any `Error occurred prerendering page` / `Build error` / non-zero exit = ❌ FIX FIRST

> ⚠️ The build may need DB + env vars set to pass. If it fails on a DB query for
> a page that shouldn't query the DB at build time, that route needs
> `export const dynamic = 'force-dynamic'` (see `app/jobs/feed.xml/route.ts`
> for the pattern). This is the #1 recurring build-breaker.

## 3. No secrets / tokens / keys in the diff

```bash
cd /Users/mehdiiarab/mapleboard && git diff --staged | grep -iE 'ghp_|github_pat_|sk-|AKIA|-----BEGIN (RSA|EC|OPENSSH) PRIVATE KEY|password|secret.*=.*[a-zA-Z0-9]{20}|token.*=.*[a-zA-Z0-9]{20}'
```
- No matches = ✅ proceed
- Matches = ❌ remove the secret from the diff, rotate it if it was real

> `.env` is gitignored. Service account JSONs stay in Vercel env, never in code.
> The IndexNow key file in `/public/*.txt` is INTENTIONALLY public (that's how
> IndexNow works) — it's not a secret.

## 4. Diff is what you intend — nothing accidental

```bash
cd /Users/mehdiiarab/mapleboard && git status --short && echo "---" && git diff --stat
```
- Only the files you meant to change appear = ✅ proceed
- Surprise files (`.env`, `package-lock.json` from a stray install, `.next/`,
  debug logs) = ❌ unstage or gitignore them

## 5. Commit message matches the house style

Short imperative summary, like the existing history:
```
Switch IndexNow key to Bing Webmaster Tools-generated key
Add IndexNow batch-submit endpoint (/api/indexnow)
```

## 6. Push uses the correct auth method (NOT plain `git push origin main`)

A plain push uses the macOS keychain credential (wrong account → 403).
ALWAYS push with the keychain bypassed and the token in the URL:

```bash
cd /Users/mehdiiarab/mapleboard
git -c credential.helper= push "https://a42641575-ux:${TOKEN}@github.com/a42641575-ux/matchdesks.git" main
```

Where `${TOKEN}` is a GitHub PAT (repo scope) from the `a42641575-ux` account,
set as a shell variable in the current session.

- `main -> main` = ✅ done
- `403 Permission denied` = ❌ wrong token / wrong account / token expired
- `Could not read from remote` = ❌ token not reaching git (check `${TOKEN}` is set)

## 7. After push — confirm Vercel build goes green

1. Push lands → Vercel auto-deploys from `main`
2. Watch: vercel.com → MatchDesks → Deployments → latest
3. **Green "Ready"** = ✅ shipped
4. **Red "Error"** = ❌ read the build log, fix, push again (back to step 1)

Do NOT consider the work done until the Vercel deployment is green.

---

## Quick copy-paste: the full pre-push gate

Run this single block before every push. If all three are clean, push.

```bash
cd /Users/mehdiiarab/mapleboard && \
echo "=== typecheck ===" && npx tsc --noEmit && echo "✅ tsc clean" && \
echo "=== secrets scan ===" && (! git diff --staged | grep -iE 'ghp_|github_pat_|sk-|AKIA|-----BEGIN (RSA|EC|OPENSSH) PRIVATE KEY|password|secret.*=.*[a-zA-Z0-9]{20}|token.*=.*[a-zA-Z0-9]{20}') && echo "✅ no secrets" && \
echo "=== diff summary ===" && git status --short && git diff --stat
```

(Skip the local `npm run build` only if you're 100% certain the change is
non-code — e.g. docs, README, or this checklist. Otherwise: run it.)
