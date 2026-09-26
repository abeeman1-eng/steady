export interface Nutrition {
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
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

export function scaleNutrition(n: Nutrition, factor: number): Nutrition {
  return { calories: n.calories * factor, proteinG: n.proteinG * factor, carbsG: n.carbsG * factor, fatG: n.fatG * factor }
}

export function sumNutrition(items: Nutrition[]): Nutrition {
  return items.reduce(
    (acc, n) => ({ calories: acc.calories + n.calories, proteinG: acc.proteinG + n.proteinG, carbsG: acc.carbsG + n.carbsG, fatG: acc.fatG + n.fatG }),
    ZERO,
  )
}

/** Whole calories, grams to one decimal place under 10 and whole above. */
export const formatCalories = (n: number) => `${Math.round(n)}`
export const formatGrams = (n: number) => `${n < 10 ? Math.round(n * 10) / 10 : Math.round(n)} g`

/** A serving count like 1, 1.5 or 0.5 without trailing zeros. */
export const formatServings = (n: number) => String(Math.round(n * 100) / 100)

// ----- USDA built-in list -----

/** Compact row from usdaFoods.json: nutrition is per 100 g; portions are [label, grams]. */
export type UsdaFood = [fdcId: number, name: string, kcal: number, protein: number, carbs: number, fat: number, portions: [string, number][]]

export interface ServingOption {
  label: string
  grams: number
}

export function usdaPer100g(food: UsdaFood): Nutrition {
  return { calories: food[2], proteinG: food[3], carbsG: food[4], fatG: food[5] }
}

/** Household measures from USDA, then 100 g, then 1 oz, e.g. "1 medium (118 g)". */
export function usdaServingOptions(food: UsdaFood): ServingOption[] {
  const household = food[6].map(([label, grams]) => ({ label: `${label} (${formatGrams(grams).replace(' g', '')} g)`, grams }))
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
    return { calories, proteinG: num(nm[`proteins_${suffix}`]) ?? 0, carbsG: num(nm[`carbohydrates_${suffix}`]) ?? 0, fatG: num(nm[`fat_${suffix}`]) ?? 0 }
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
