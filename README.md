# Steady

A beginner-friendly fitness tracker: strength and running plans, workout logging and progress.
It's a mobile-first Progressive Web App that runs in any browser, installs to the home screen,
works offline, and stores all data on the device (no login).

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit + data-layer tests
npm run build      # type-check and production build (dist/)
```

To try it on a phone on the same Wi-Fi, run `npm run dev -- --host` and open the Network URL.
Installing to the home screen and the camera (Phase 4) need HTTPS, so use a deployed build for those.

## Stack

React + TypeScript + Vite, Tailwind CSS v4, Dexie (IndexedDB), React Router, vite-plugin-pwa, Vitest.

## Project structure

```
src/
  domain/              Pure logic, no storage or UI. Fully unit tested.
    planGenerator/     Rule-based weekly plans from onboarding answers
    exerciseLibrary.ts 45 exercises with step-by-step guides, form cues and substitutes
    records.ts         Epley 1RM and PR detection
    units.ts, dates.ts, backupReminder.ts
  data/
    db.ts              Dexie schema (all tables exist from v1)
    schema.ts          Record types; every record has id, createdAt, updatedAt, userId
    repositories/      The only code that touches the database. Swap these for a synced backend later.
    backup.ts          JSON export/import and persistent-storage request
  features/            One folder per screen: onboarding, today, session, exercises (guide), history, plan, progress, settings
  components/          Shared UI (buttons, cards, tab bar, difficulty picker)
  theme/tokens.css     Color tokens (dark only for now; a light theme only redefines these)
```

Storage conventions: weights are stored in kilograms and distances in meters, and converted
for display. Dates are local `YYYY-MM-DD` strings. To change the schema, add a new
`db.version(n)` block in `db.ts`; never edit an existing one.

## Build phases

- [x] **Phase 1: Core strength.** PWA shell, onboarding, exercise library, strength plan generation, set logging, rest timer, difficulty and notes, PRs and est. 1RM, export/import
- [ ] **Phase 2: Running.** Running plan generation, unrealistic-goal flag, missed-day marking, manual run logging, strength progression suggestions
- [ ] **Phase 3: Progress and Strava.** Charts, consistency calendar, Strava connect and import
- [ ] **Phase 4: Meals.** Food search, barcode scan, manual entry, favorites, daily totals

### Phase 1 notes

- Running and weight-loss goals currently get a mixed plan of strength days plus easy cardio or run/walk days. The running goal from onboarding is saved and full running plans arrive in Phase 2.
- The first time an exercise is logged sets a baseline. PRs are counted against every earlier completed set, including earlier sets in the same workout.
- The PWA update prompt waits for the user to tap Reload, so an update never interrupts a workout.

## Deploying

The app is a static site. `vercel.json` (Vercel) and `public/_redirects` (Netlify) send all routes to
`index.html`. Strava (Phase 3) and USDA (Phase 4) secrets will go in the host's environment
variables for serverless functions, never in this repo.
