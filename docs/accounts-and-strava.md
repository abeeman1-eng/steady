# Accounts, friend sharing and Strava: design (deferred)

Status: **not built.** Steady is a static site on GitHub Pages with all data in the browser
(IndexedDB). Accounts, friend sharing and Strava each need a server, so they were deferred
from v1. This document records how they would be added so the work can start without a
rewrite.

## Why these need a server

| Feature | What a static site can't do |
|---|---|
| Accounts | Store data off the device, verify who someone is, recover a lost device. |
| Friend sharing | Let one person read another's data, with access rules enforced somewhere the client can't bypass. |
| Strava | Strava's OAuth token exchange and refresh need the app's **client secret**, which must never ship in browser code (anyone could read it from the bundle). |

## Recommended backend: Supabase

Free tier, Postgres, built-in auth (email magic link, Google, Apple), row-level security for
sharing rules, and Edge Functions for the Strava secret. Firebase would also work, but
cross-user sharing rules are harder to express and its server functions need the paid plan.

**Setup the owner does (Claude can't create accounts):** create a Supabase project, add the
project URL and anon key to the deploy workflow as public build variables, and register a
Strava API application at developers.strava.com (callback domain = the Pages domain). The
Strava client secret goes only in Supabase's function secrets.

## Accounts and sync

What's already in place:

- Every record has `id` (UUID), `createdAt`, `updatedAt` and `userId` (currently `'local'`).
- All storage goes through `src/data/repositories/`, so screens don't change.
- Weights are stored in kg and distances in meters, so server rows need no conversion.

Plan:

1. **Sign-in stays optional.** The app keeps working fully offline with no account; signing in adds backup and sharing.
2. On first sign-in, rewrite `userId` from `'local'` to the account id (one Dexie migration) and upload everything.
3. **Sync:** IndexedDB stays the source the UI reads (offline-first). A sync queue pushes changed rows (`updatedAt` newer than the last sync) and pulls server rows changed since the last pull. Conflicts resolve by last `updatedAt`, per row, which fits a single person editing their own data. Deletes become tombstones (`deletedAt`) so they sync.
4. Tables mirror `src/data/schema.ts`, each with `user_id` and a row-level security policy `user_id = auth.uid()`.
5. Not synced: `lookupCache` (disposable) and `stravaAuth` (tokens stay server-side; see below).

## Friend sharing

Spec scope: friends can see workouts, PRs, notes and meals.

- `friendships(requester, addressee, status)` with invite by link or code; both sides must accept.
- Per-category sharing settings (workouts, PRs, notes, meals), **off by default**, chosen by the person sharing. Health considerations, body weight, age and nutrition targets are never shared.
- Row-level security: a friend can `select` a row only if an accepted friendship exists and that category is shared. Friends can never write.
- UI: a Friends tab (or a section in Progress) with a read-only feed of shared workouts and PRs. Every new page follows the navigation rule in `CLAUDE.md`.
- Minors: since age is self-reported, sharing should stay off for anyone under 18 unless a later review decides otherwise.

## Strava

Spec scope: connect Strava, import new runs, match each to that day's planned session; the
user adds difficulty and notes.

1. **Connect:** the app sends the user to Strava's authorize page (scope `activity:read`). Strava redirects back with a code.
2. **Token exchange (server):** a Supabase Edge Function swaps the code for access and refresh tokens using the client secret and stores them in a `strava_tokens` table only that function can read. The browser never sees the refresh token or the secret. (The existing `stravaAuth` Dexie table should be removed or left unused, and kept out of backups, so tokens never land in an exported file.)
3. **Import:** a second function fetches activities since the last import (`type = Run`) and returns distance, moving time, date and `id`. The client stores each as a workout plus `RunRecord` with `source: 'strava'` and `stravaActivityId` (already in the schema and indexed), skipping ids it already has.
4. **Matching:** a run on a day with a planned run session is linked to it (`plannedSessionId`) and marks it done, exactly like manual logging (`logRun` in `workoutRepo.ts`). Multiple runs on one day: the longest matches; the rest are unplanned runs.
5. **Disconnect** revokes the token at Strava and deletes the stored tokens.
6. Acceptance test from the spec: a Strava run appears matched to the planned session within one sync.

## Risks to plan for

- Sync bugs can lose data. Keep JSON export/import as an independent backup, and test sync with two devices offline then online.
- Moving health-adjacent data (meals, body weight, health considerations) to a server raises the privacy bar: needs a privacy policy, account deletion that removes server data, and data export.
- Strava API rate limits (100 requests per 15 minutes per app by default) mean import should be on demand or batched, not polled.
