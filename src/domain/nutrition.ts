export interface Nutrition {
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  /** Extras are optional: undefined means the source didn't list it (shown as "–", not 0). */
  fiberG?: number
  sugarG?: number
  satFatG?: number
  sodiumMg?: number
}

export const EXTRA_KEYS = ['fiberG', 'sugarG', 'satFatG', 'sodiumMg'] as const
export type ExtraKey = (typeof EXTRA_KEYS)[number]
export const NUTRIENT_KEYS = ['calories', 'proteinG', 'carbsG', 'fatG', ...EXTRA_KEYS] as const
export type NutrientKey = (typeof NUTRIENT_KEYS)[number]

/** Display metadata for every tracked nutrient. `limit` nutrients are ceilings, not goals. */
export const NUTRIENTS: Record<NutrientKey, { label: string; short: string; unit: 'kcal' | 'g' | 'mg'; limit?: boolean }> = {
  calories: { label: 'Calories', short: 'Cal', unit: 'kcal' },
  proteinG: { label: 'Protein', short: 'P', unit: 'g' },
  carbsG: { label: 'Carbs', short: 'C', unit: 'g' },
  fatG: { label: 'Fat', short: 'F', unit: 'g' },
  fiberG: { label: 'Fiber', short: 'Fiber', unit: 'g' },
  sugarG: { label: 'Sugar', short: 'Sugar', unit: 'g', limit: true },
  satFatG: { label: 'Saturated fat', short: 'Sat fat', unit: 'g', limit: true },
  sodiumMg: { label: 'Sodium', short: 'Sodium', unit: 'mg', limit: true },
}

export function formatNutrient(key: NutrientKey, value: number | undefined): string {
  if (value === undefined) return '–'
  const unit = NUTRIENTS[key].unit
  if (unit === 'kcal') return formatCalories(value)
  if (unit === 'mg') return `${Math.round(value)} mg`
  return formatGrams(value)
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snacks'

export const MEAL_TYPES: { value: MealType; label: string }[] = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snacks', label: 'Snacks' },
]

/** Sensible default meal for "Log food" based on the time of day. */
export function mealForTime(now = new Date()): MealType {
  const h = now.getHours() + now.getMinutes() / 60
  if (h >= 4 && h < 10.5) return 'breakfast'
  if (h >= 11 && h < 14.5) return 'lunch'
  if (h >= 17 && h < 21) return 'dinner'
  return 'snacks'
}

export const ZERO: Nutrition = { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }

/** Just the nutrition fields of a record (entries and foods carry other fields too). */
export function pickNutrition(n: Nutrition): Nutrition {
  const out: Nutrition = { calories: n.calories, proteinG: n.proteinG, carbsG: n.carbsG, fatG: n.fatG }
  for (const k of EXTRA_KEYS) if (typeof n[k] === 'number') out[k] = n[k]
  return out
}

export function scaleNutrition(n: Nutrition, factor: number): Nutrition {
  const out: Nutrition = { calories: n.calories * factor, proteinG: n.proteinG * factor, carbsG: n.carbsG * factor, fatG: n.fatG * factor }
  for (const k of EXTRA_KEYS) if (typeof n[k] === 'number') out[k] = n[k]! * factor
  return out
}

/** Totals. An extra is included once any item lists it; items that don't list it add nothing. */
export function sumNutrition(items: Nutrition[]): Nutrition {
  const out: Nutrition = { ...ZERO }
  for (const n of items) {
    out.calories += n.calories
    out.proteinG += n.proteinG
    out.carbsG += n.carbsG
    out.fatG += n.fatG
    for (const k of EXTRA_KEYS) if (typeof n[k] === 'number') out[k] = (out[k] ?? 0) + n[k]!
  }
  return out
}

/** How many items don't list each extra, for an honest "some foods don't list fiber" note. */
export function countMissingExtras(items: Nutrition[]): Record<ExtraKey, number> {
  return Object.fromEntries(EXTRA_KEYS.map((k) => [k, items.filter((n) => typeof n[k] !== 'number').length])) as Record<ExtraKey, number>
}

/** Whole calories, grams to one decimal place under 10 and whole above. */
export const formatCalories = (n: number) => `${Math.round(n)}`
export const formatGrams = (n: number) => `${n < 10 ? Math.round(n * 10) / 10 : Math.round(n)} g`

/** A serving count like 1, 1.5 or 0.5 without trailing zeros. */
export const formatServings = (n: number) => String(Math.round(n * 100) / 100)

// ----- USDA built-in list -----

/** Compact row from usdaFoods.json: nutrition is per 100 g; portions are [label, grams]. */
export type UsdaFood = [
  fdcId: number,
  name: string,
  kcal: number,
  protein: number,
  carbs: number,
  fat: number,
  fiber: number | null,
  sugar: number | null,
  satFat: number | null,
  sodiumMg: number | null,
  portions: [string, number][],
]

export interface ServingOption {
  label: string
  grams: number
}

export function usdaPer100g(food: UsdaFood): Nutrition {
  const n: Nutrition = { calories: food[2], proteinG: food[3], carbsG: food[4], fatG: food[5] }
  if (food[6] !== null) n.fiberG = food[6]
  if (food[7] !== null) n.sugarG = food[7]
  if (food[8] !== null) n.satFatG = food[8]
  if (food[9] !== null) n.sodiumMg = food[9]
  return n
}

/** Household measures from USDA, then 100 g, then 1 oz, e.g. "1 medium (118 g)". */
export function usdaServingOptions(food: UsdaFood): ServingOption[] {
  const household = food[10].map(([label, grams]) => ({ label: `${label} (${formatGrams(grams).replace(' g', '')} g)`, grams }))
  return [...household, { label: '100 g', grams: 100 }, { label: '1 oz (28 g)', grams: 28.35 }]
}

/** The serving most people mean: a "medium" size, then the label serving, then USDA's first. */
export function defaultServingIndex(options: ServingOption[]): number {
  const find = (re: RegExp) => options.findIndex((o) => re.test(o.label))
  for (const re of [/^1 medium\b/i, /^1 NLEA serving/i, /^1 (large|slice|piece|fruit|serving)\b/i]) {
    const i = find(re)
    if (i >= 0) return i
  }
  return 0
}

export const nutritionForGrams =(per100g: Nutrition, grams: number) => scaleNutrition(per100g, grams / 100)

// ----- Barcodes -----

/**
 * Digits only, with 12-digit UPC-A codes written as 13-digit EAN (leading 0), so a product
 * scanned as either form finds the same saved food.
 */
export function normalizeBarcode(code: string): string {
  const digits = code.replace(/\D/g, '')
  return digits.length === 12 ? `0${digits}` : digits
}

/**
 * Expand an 8-digit UPC-E (the short code on small US packages) to its 12-digit UPC-A form,
 * which is what product databases store. Only call this for codes scanned as UPC-E, since
 * 8-digit EAN-8 codes look the same.
 */
export function expandUpcE(code: string): string {
  const d = code.replace(/\D/g, '')
  if (d.length !== 8 || (d[0] !== '0' && d[0] !== '1')) return d
  const [ns, d1, d2, d3, d4, d5, d6, check] = d
  let body: string
  if (d6 <= '2') body = `${d1}${d2}${d6}0000${d3}${d4}${d5}`
  else if (d6 === '3') body = `${d1}${d2}${d3}00000${d4}${d5}`
  else if (d6 === '4') body = `${d1}${d2}${d3}${d4}00000${d5}`
  else body = `${d1}${d2}${d3}${d4}${d5}0000${d6}`
  return `${ns}${body}${check}`
}

export const isPlausibleBarcode = (code: string) => /^\d{8}$|^\d{12,14}$/.test(code.replace(/\D/g, ''))

// ----- Open Food Facts -----

export interface ParsedProduct {
  name: string
  servingSize: string
  nutrition: Nutrition | null
}

type OffNutriments = Record<string, number | string | undefined>

const num = (v: unknown): number | undefined => {
  const n = typeof v === 'string' ? parseFloat(v) : typeof v === 'number' ? v : NaN
  return Number.isFinite(n) ? n : undefined
}

/**
 * Turn an Open Food Facts product into a food with nutrition per serving. Prefers the label's
 * per-serving values, then per-100 g scaled to the serving weight, then plain per-100 g.
 * `nutrition` is null when calories are missing, so the caller can ask for manual entry.
 */
export function parseOffProduct(product: Record<string, unknown> | undefined | null): ParsedProduct | null {
  if (!product) return null
  const nm = (product.nutriments ?? {}) as OffNutriments
  const name = [product.product_name, product.brands].map((s) => (typeof s === 'string' ? s.trim() : Array.isArray(s) ? s.join(', ') : '')).filter(Boolean)
  const displayName = name.length === 2 && !name[0].toLowerCase().includes(name[1].toLowerCase()) ? `${name[0]} (${name[1]})` : name[0] || 'Unnamed product'

  const pick = (suffix: 'serving' | '100g'): Nutrition | null => {
    const calories = num(nm[`energy-kcal_${suffix}`]) ?? (num(nm[`energy_${suffix}`]) !== undefined ? num(nm[`energy_${suffix}`])! / 4.184 : undefined)
    if (calories === undefined) return null
    const n: Nutrition = { calories, proteinG: num(nm[`proteins_${suffix}`]) ?? 0, carbsG: num(nm[`carbohydrates_${suffix}`]) ?? 0, fatG: num(nm[`fat_${suffix}`]) ?? 0 }
    const fiber = num(nm[`fiber_${suffix}`])
    const sugar = num(nm[`sugars_${suffix}`])
    const satFat = num(nm[`saturated-fat_${suffix}`])
    const sodiumG = num(nm[`sodium_${suffix}`]) // Open Food Facts stores sodium in grams
    if (fiber !== undefined) n.fiberG = fiber
    if (sugar !== undefined) n.sugarG = sugar
    if (satFat !== undefined) n.satFatG = satFat
    if (sodiumG !== undefined) n.sodiumMg = sodiumG * 1000
    return n
  }

  const servingLabel = typeof product.serving_size === 'string' && product.serving_size.trim() ? product.serving_size.trim() : null
  const servingGrams = num(product.serving_quantity)
  const perServing = pick('serving')
  if (perServing && servingLabel) return { name: displayName, servingSize: servingLabel, nutrition: perServing }

  const per100 = pick('100g')
  if (per100 && servingGrams && servingGrams > 0) {
    return { name: displayName, servingSize: servingLabel ?? `${servingGrams} g`, nutrition: scaleNutrition(per100, servingGrams / 100) }
  }
  if (per100) return { name: displayName, servingSize: '100 g', nutrition: per100 }
  return { name: displayName, servingSize: servingLabel ?? '1 serving', nutrition: null }
}
