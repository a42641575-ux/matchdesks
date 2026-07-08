# Prisma + Vercel deploy — the migration gap (IMPORTANT)

> **Read this before adding any new field to `prisma/schema.prisma`.**
> This documents a real production outage caused by schema/prod-DB drift on
> 2026-07-08. It cost ~1 hour of failed builds. The fix below is already in
> place — do not remove it.

---

## The problem (what happened)

We added a `postedByEmail String?` column to the `Job` model and committed a
new migration. The deploy **failed** with:

```
The column `Job.postedByEmail` does not exist in the current database.
Error occurred prerendering page "/"
```

### Why it happened — two things compounded

**1. Vercel does NOT auto-apply Prisma migrations.**

This is the core misunderstanding. Vercel's build only runs the scripts in
`package.json`. The existing `postinstall` script was:

```json
"postinstall": "prisma generate"
```

`prisma generate` **only regenerates the TypeScript client** so the code can
reference new fields/types. It does **NOT** touch the database. The actual
schema change (`ALTER TABLE "Job" ADD COLUMN "postedByEmail" TEXT`) lives in
`prisma/migrations/*/migration.sql` and only runs when someone (or some script)
explicitly runs `prisma migrate deploy`.

So: locally we ran `prisma migrate dev` → column existed in the local DB →
local build passed. Production Neon never got the column.

**2. The Next.js build queries the database.**

Some routes use `export const revalidate = N` (ISR), which makes Next.js try to
**prerender those pages at build time** — and prerendering runs the Prisma
queries against whatever `DATABASE_URL` the build environment has (production
Neon). The generated Prisma client now expected `Job.postedByEmail` to exist,
the prod DB didn't have it → `P2022` error → build failed on `/`.

```
Local:  schema ✓  migration applied ✓  build ✓  →  push
Vercel: schema ✓  migration NEVER applied ✗  build ✗  (prerender hits missing column)
```

### Why it was hard to spot

- **Local builds always passed** — because the local DB had the migration.
- **`tsc` passed** — TypeScript only checks types, not the live DB.
- **The error looked like a prerender bug** ("Error occurred prerendering page /"),
  which misdirected us to caching issues before the real cause (missing column)
  was visible in the build log.

---

## The fix (what we changed)

Added a `vercel-build` script to `package.json`:

```json
"vercel-build": "prisma migrate deploy && next build"
```

Vercel automatically runs `vercel-build` instead of `build` when it exists.
This runs **all pending migrations against the production database before the
Next.js build starts**, so the schema and DB are always in sync at build time.

After this change, the deploy went green on the first try.

---

## The mental model — three separate things that must agree

```
┌──────────────────┐   prisma generate    ┌──────────────────┐
│  schema.prisma   │ ───────────────────→ │  Prisma Client   │
│  (source of      │   (postinstall)      │  (TS types,      │
│   truth: fields) │                      │   query builder) │
└──────────────────┘                      └──────────────────┘
         │                                          │
         │ prisma migrate deploy                    │ used by next build
         │ (vercel-build script)                    │ (prerender queries)
         ▼                                          ▼
┌──────────────────┐                      ┌──────────────────┐
│  Database        │ ←─────────────────── │  Pages render    │
│  (actual tables, │   queries expect      │  (need the       │
│   columns)       │   columns to exist    │   columns)       │
└──────────────────┘                      └──────────────────┘
```

- **`prisma generate`** keeps the CLIENT in sync with the SCHEMA (types only)
- **`prisma migrate deploy`** keeps the DATABASE in sync with the SCHEMA (actual columns)
- **`next build`** prerender keeps the PAGES working by querying the DB

If any two are out of sync, the build fails. The `vercel-build` script ensures
the migration runs before the build, so all three agree.

---

## Rule for every future schema change

When you add/remove/rename a field in `prisma/schema.prisma`:

1. **Locally:** `npx prisma migrate dev --name <descriptive_name>`
   - Updates the schema
   - Creates a migration file in `prisma/migrations/`
   - Applies it to the local DB
   - Regenerates the client
2. **Commit the migration file** — it MUST ship with the code (it's how prod learns about the change)
3. **Push.** The `vercel-build` script handles applying it to prod automatically.
4. **Never edit a committed migration** — always create a new one. Editing
   applied migrations breaks the migration history.

---

## If the build ever fails with "column does not exist" again

It means a migration didn't apply. To fix manually:

```bash
# Get the production DATABASE_URL from Vercel → Settings → Environment Variables
# Then run migrations against it directly:
cd /Users/mehdiiarab/mapleboard
DATABASE_URL="<prod-neon-url>" npx prisma migrate deploy
```

`migrate deploy` is idempotent — it only runs migrations that haven't been
applied yet, so it's always safe to run.

---

## Related Vercel gotcha: stale CDN cache

Separately, ISR pages (`revalidate = N`) can serve stale HTML from Vercel's
edge even after a successful deploy, because the cache namespace persists across
redeploys of the same deployment. If a deploy goes green but the change isn't
visible on the live site, trigger a **brand-new deployment** (empty commit +
push, or Vercel dashboard → Redeploy). A new deployment gets a fresh cache
namespace and the production domain repoints to it.

```bash
# Force a fresh deployment (new cache namespace)
git commit --allow-empty -m "Trigger fresh deploy to clear stale CDN cache"
git -c credential.helper= push "https://a42641575-ux:${TOKEN}@github.com/a42641575-ux/matchdesks.git" main
```
