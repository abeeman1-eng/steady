import { type CatalogFood, CATALOG, CATALOG_BY_ID, type DietStyle, MEAL_SHARES, type MealKind, type MealTemplate, TEMPLATES, allowedFor } from './foodCatalog'
import { type Nutrition, ZERO, scaleNutrition, sumNutrition } from './nutrition'

/** Looks up USDA nutrition per 100 g for a food's fdcId. */
export type Per100 = (fdcId: number) => Nutrition | undefined

export interface PlannedItem {
  food: CatalogFood
  grams: number
  nutrition: Nutrition
}

export interface PlannedMeal {
  template: MealTemplate
  /** Display name with the protein actually used, e.g. "Tofu rice bowl". */
  name: string
  items: PlannedItem[]
  totals: Nutrition
  /** Weighted relative error against the target; lower is better. */
  error: number
}

type Core = 'calories' | 'proteinG' | 'carbsG' | 'fatG'
const CORE: Core[] = ['calories', 'proteinG', 'carbsG', 'fatG']
/** Calories and protein matter most to people following a plan. */
const WEIGHT: Record<Core, number> = { calories: 2, proteinG: 2, carbsG: 1, fatG: 1 }
/** Going somewhat over on protein is harmless; falling short on it (or on calories) is what people notice. */
const PROTEIN_OVER_WEIGHT = 0.2
const PROTEIN_UNDER_WEIGHT = 3
const weightFor = (k: Core, total: number, target: number) => (k === 'proteinG' ? (total > target ? PROTEIN_OVER_WEIGHT : PROTEIN_UNDER_WEIGHT) : WEIGHT[k])
/** Keeps tiny targets (e.g. 3 g of fat in a snack) from dominating the error. */
const FLOOR: Record<Core, number> = { calories: 60, proteinG: 6, carbsG: 8, fatG: 4 }

export function mealTarget(daily: Nutrition, meal: MealKind): Nutrition {
  return scaleNutrition(daily, MEAL_SHARES[meal])
}

/** The foods a template uses for a diet style, or null if a slot has no allowed option. */
export function resolveTemplate(template: MealTemplate, diet: DietStyle): CatalogFood[] | null {
  const foods: CatalogFood[] = []
  for (const slot of template.slots) {
    const pick = slot.options.map((id) => CATALOG_BY_ID.get(id)!).find((f) => allowedFor(diet, f))
    if (!pick) return null
    foods.push(pick)
  }
  return foods
}

function errorOf(totals: Nutrition, target: Nutrition): number {
  return CORE.reduce((sum, k) => sum + weightFor(k, totals[k], target[k]) * ((totals[k] - target[k]) / Math.max(target[k], FLOOR[k])) ** 2, 0)
}

const snap = (f: CatalogFood, g: number) => Math.min(f.max, Math.max(f.min, f.min + Math.round((g - f.min) / f.step) * f.step))

/**
 * Choose grams for each food so the meal lands as close as possible to the target, using
 * bounded coordinate descent on a weighted least-squares error, then snapping to each food's
 * realistic steps (one egg, one slice) with a small local search.
 */
export function solvePortions(foods: CatalogFood[], target: Nutrition, per100: Per100): PlannedItem[] {
  const per = foods.map((f) => per100(f.fdcId) ?? ZERO)
  const g = foods.map((f) => (f.min + f.max) / 2)
  const totalsFor = (grams: number[]) => sumNutrition(grams.map((x, i) => scaleNutrition(per[i], x / 100)))

  for (let iter = 0; iter < 80; iter++) {
    for (let i = 0; i < foods.length; i++) {
      let num = 0
      let den = 0
      for (const k of CORE) {
        const d = Math.max(target[k], FLOOR[k])
        const c = per[i][k] / 100 / d
        const others = g.reduce((s, x, j) => (j === i ? s : s + (per[j][k] * x) / 100), 0)
        const r = (others - target[k]) / d
        const w = weightFor(k, others + (per[i][k] * g[i]) / 100, target[k])
        num += w * c * r
        den += w * c * c
      }
      if (den > 0) g[i] = Math.min(foods[i].max, Math.max(foods[i].min, -num / den))
    }
  }

  const snapped = g.map((x, i) => snap(foods[i], x))
  let best = errorOf(totalsFor(snapped), target)
  for (let pass = 0; pass < 20; pass++) {
    let improved = false
    for (let i = 0; i < foods.length; i++) {
      for (const dir of [-1, 1]) {
        const trial = [...snapped]
        trial[i] = snap(foods[i], trial[i] + dir * foods[i].step)
        const e = errorOf(totalsFor(trial), target)
        if (e < best - 1e-9) {
          best = e
          snapped.splice(0, snapped.length, ...trial)
          improved = true
        }
      }
    }
    if (!improved) break
  }

  return foods.map((food, i) => ({ food, grams: snapped[i], nutrition: scaleNutrition(per[i], snapped[i] / 100) }))
}

export function planMeal(template: MealTemplate, target: Nutrition, diet: DietStyle, per100: Per100): PlannedMeal | null {
  const foods = resolveTemplate(template, diet)
  if (!foods) return null
  const items = solvePortions(foods, target, per100)
  const totals = sumNutrition(items.map((i) => i.nutrition))
  const protein = foods.find((f) => f.role === 'protein')
  const name = template.name.replace('{protein}', protein?.short ?? protein?.name ?? 'Protein')
  return { template, name, items, totals, error: errorOf(totals, target) }
}

/** The best-fitting meal ideas for a meal and budget. */
export function mealIdeas(meal: MealKind, budget: Nutrition, diet: DietStyle, per100: Per100, limit = 3): PlannedMeal[] {
  return TEMPLATES.filter((t) => t.meal === meal)
    .map((t) => planMeal(t, budget, diet, per100))
    .filter((m): m is PlannedMeal => m !== null)
    .sort((a, b) => a.error - b.error)
    .slice(0, limit)
}

export const MEAL_ORDER: MealKind[] = ['breakfast', 'lunch', 'dinner', 'snacks']

/**
 * A sample day hitting the daily targets. Meals are planned in order, each aiming at its share of
 * what's still left, so later meals make up for earlier ones. `variant` cycles through the good
 * options for each meal.
 */
export function planDay(daily: Nutrition, diet: DietStyle, per100: Per100, variant = 0): Record<MealKind, PlannedMeal> {
  const out = {} as Record<MealKind, PlannedMeal>
  let eaten: Nutrition = { ...ZERO }
  let shareLeft = 1
  const usedProteins = new Set<string>()
  for (const [i, meal] of MEAL_ORDER.entries()) {
    const fraction = MEAL_SHARES[meal] / shareLeft
    const target = Object.fromEntries(CORE.map((k) => [k, Math.max(0, (daily[k] - eaten[k]) * fraction)])) as unknown as Nutrition
    const all = mealIdeas(meal, target, diet, per100, 4)
    // Prefer a protein not already eaten today (no tofu at both lunch and dinner), but only among
    // ideas that fit nearly as well as the best, and never at the day's last meal.
    const isLast = i === MEAL_ORDER.length - 1
    const fresh = all.filter((m) => m.error <= all[0].error * 2 + 0.05 && !m.items.some((it) => it.food.role === 'protein' && usedProteins.has(it.food.id)))
    const ideas = (fresh.length && !isLast ? fresh : all).slice(0, 3)
    // Vary the earlier meals; the last one takes the best fit to close the day.
    const pick = isLast ? ideas[0] : ideas[(variant + i) % ideas.length]
    out[meal] = pick
    for (const it of pick.items) if (it.food.role === 'protein') usedProteins.add(it.food.id)
    eaten = sumNutrition([eaten, pick.totals])
    shareLeft -= MEAL_SHARES[meal]
  }
  return out
}

export type Focus = 'proteinG' | 'carbsG' | 'fatG' | 'fiberG'

export interface Recommendation {
  focus: Focus
  remaining: number
  items: PlannedItem[]
}

const FOCUS_ROLES: Record<Focus, CatalogFood['role'][]> = {
  proteinG: ['protein'],
  carbsG: ['carb', 'fruit'],
  fatG: ['fat'],
  fiberG: ['veg', 'fruit', 'protein', 'carb'],
}

/**
 * Foods that best close the biggest remaining gap (relative to its target), sized to cover the
 * gap without going past the calories left. Returns null when there's nothing useful to suggest.
 */
/** Protein is what most people need help with; fiber is nice to have. */
const GAP_PRIORITY: Record<Focus, number> = { proteinG: 1.3, carbsG: 1, fatG: 1, fiberG: 0.8 }

export interface Gap {
  focus: Focus
  remaining: number
}

/**
 * Remaining gaps against the user's targets, most important first (share of target left,
 * weighted by GAP_PRIORITY). `exclude` drops nutrients the log can't measure reliably, e.g.
 * fiber when some foods don't list it.
 */
export function rankGaps(totals: Nutrition, targets: Partial<Nutrition>, exclude: Focus[] = []): Gap[] {
  if ((targets.calories ?? Infinity) - totals.calories < 80) return []
  return (['proteinG', 'carbsG', 'fatG', 'fiberG'] as Focus[])
    .filter((k) => !exclude.includes(k) && targets[k] && targets[k]! - (totals[k] ?? 0) >= (k === 'fiberG' ? 4 : 8))
    .map((k) => ({ focus: k, remaining: targets[k]! - (totals[k] ?? 0), score: ((targets[k]! - (totals[k] ?? 0)) / targets[k]!) * GAP_PRIORITY[k] }))
    .sort((a, b) => b.score - a.score)
    .map(({ focus, remaining }) => ({ focus, remaining }))
}

export function recommendFoods(
  totals: Nutrition,
  targets: Partial<Nutrition>,
  diet: DietStyle,
  per100: Per100,
  opts: { focus?: Focus; exclude?: Focus[]; limit?: number } = {},
): Recommendation | null {
  const limit = opts.limit ?? 5
  const calLeft = (targets.calories ?? Infinity) - totals.calories
  const gaps = rankGaps(totals, targets, opts.exclude)
  const found = opts.focus ? gaps.find((g) => g.focus === opts.focus) : gaps[0]
  if (!found) return null
  const gap = { k: found.focus, left: found.remaining }

  const ranked = CATALOG.filter((f) => FOCUS_ROLES[gap.k].includes(f.role) && allowedFor(diet, f))
    .map((f) => ({ f, n: per100(f.fdcId) }))
    .filter((x): x is { f: CatalogFood; n: Nutrition } => !!x.n && x.n.calories > 0 && (x.n[gap.k] ?? 0) > 0)
    .map((x) => ({ ...x, score: ((x.n[gap.k] ?? 0) / x.n.calories) * (STAPLES.has(x.f.id) ? STAPLE_BOOST : 1) }))
    .sort((a, b) => b.score - a.score)
  const candidates = pickVaried(ranked, limit)

  const items = candidates.map(({ f, n }) => {
    const forGap = (gap.left / (n[gap.k] ?? 1)) * 100
    const forCalories = Number.isFinite(calLeft) ? (calLeft / n.calories) * 100 : Infinity
    const grams = snap(f, Math.min(forGap, forCalories))
    return { food: f, grams, nutrition: scaleNutrition(n, grams / 100) }
  })
  return { focus: gap.k, remaining: gap.left, items }
}

/** Foods most people already buy get a small boost, so suggestions feel familiar. */
const STAPLES = new Set(['chicken-breast', 'lean-beef', 'eggs', 'greek-yogurt', 'tuna', 'salmon', 'tofu', 'lentils', 'oats', 'white-rice', 'potato', 'banana', 'avocado', 'peanut-butter', 'almonds', 'broccoli'])
const STAPLE_BOOST = 1.25

/** How many suggestions each kind of food may take before the rest are filled by score. */
const GROUP_CAP: Record<string, number> = { meat: 2, fish: 1, eggDairy: 1, plant: 1 }
const groupOf = (f: CatalogFood) => (f.role !== 'protein' ? f.role : f.diet === 'egg' || f.diet === 'dairy' ? 'eggDairy' : f.diet)

/**
 * Take the best-scoring foods while keeping variety (e.g. two meats, a fish, an egg or dairy
 * option and a plant option for protein), then fill any leftover slots by score.
 */
function pickVaried<T extends { f: CatalogFood }>(ranked: T[], limit: number): T[] {
  const picked: T[] = []
  const counts: Record<string, number> = {}
  for (const x of ranked) {
    const g = groupOf(x.f)
    if (picked.length < limit && (counts[g] ?? 0) < (GROUP_CAP[g] ?? 2)) {
      picked.push(x)
      counts[g] = (counts[g] ?? 0) + 1
    }
  }
  for (const x of ranked) if (picked.length < limit && !picked.includes(x)) picked.push(x)
  return picked
}

/** "2 eggs (100 g)", "1 tbsp (16 g)" or "150 g". */
export function portionLabel(food: CatalogFood, grams: number): string {
  if (!food.unit) return `${Math.round(grams)} g`
  const count = Math.round((grams / food.unit.grams) * 10) / 10
  const name = count === 1 ? food.unit.name : (food.unit.plural ?? `${food.unit.name}s`)
  const unitless = ['tbsp', 'tsp'].includes(food.unit.name)
  return `${count} ${unitless ? food.unit.name : name} (${Math.round(grams)} g)`
}
