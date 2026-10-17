# Steady: notes for Claude Code

Mobile-first PWA (React, TypeScript, Vite, Tailwind v4, Dexie). All data stays on the device. Deployed to GitHub Pages from `master` by `.github/workflows/deploy.yml`. See README.md for structure and phases.

## Design requirements (apply to every change)

### Navigation: every tracking page needs a way back

- **Every page that isn't a main tab (Today, Plan, Exercises, History, Progress, Settings) must show a visible Back or Home action at the top.** Use `<BackButton parent="…" parentLabel="…" />` from `src/components/BackButton.tsx`. It goes back when there's an earlier page in the app, and otherwise goes to `parent` and names it ("‹ Food log"), so a page opened fresh (home-screen launch, shared link, reload) still has a way home.
- **Never use a bare `navigate(-1)`.** It leaves the app when the page was opened fresh.
- Choose `parent` so that following parents always reaches Today (`/`). For example, Add food goes to the food log, and the food log goes to Today.
- `src/app.navigation.test.ts` enforces both rules for every route in `App.tsx`. Don't exempt a new page to make it pass.

### Test after the user enters information

Before calling a new or changed tracking page done, test it in the browser **after entering information**, not just on first load:

1. Open the page fresh (a new tab straight to its URL, so there's no in-app history).
2. Enter or log something (a food, a set, a target) and save it.
3. Confirm the visible Back or Home action still works from the page you end up on, and leads back to Today.
4. Repeat once arriving from inside the app (with history), and once at 375 px wide.

### Other standing rules

- 44 px minimum tap targets, no horizontal overflow at 375 px, and visible labels (color is never the only signal).
- Nutrition targets are adults-only and off for some health conditions: read targets through `useNutritionTargets`, never `profile.nutritionTargets` directly (see "Safety limits" and "Health considerations" in the README).
- Any new food suggestion or meal feature must use `foodPrefs` from `useNutritionTargets` (diet style, allergens, conditions), so allergies are always respected.
- Running plans (`src/domain/runningPlan.ts`) must keep the spec's safety rules: no week more than 10% above the biggest week so far, peak about 3 weeks out, no back-to-back hard days, intervals for experienced runners only. `runningPlan.test.ts` checks these; don't loosen them to fit a date (a too-soon date gets the warning and a lower peak).
- Pure logic lives in `src/domain` with unit tests. Storage goes through `src/data/repositories`.
- Before committing, run `npm run lint`, `npm test` and `npm run build`.
