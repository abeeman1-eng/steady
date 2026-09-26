import type { UsdaFood } from './nutrition'

const singular = (w: string) => (w.length > 3 && w.endsWith('s') && !w.endsWith('ss') ? (w.endsWith('ies') ? `${w.slice(0, -3)}y` : w.slice(0, -1)) : w)

export const foodWords = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map(singular)

/** USDA often leads with a category ("Nuts, almonds", "Cheese, cheddar"); the food is the next part. */
const CATEGORY_PREFIXES = new Set(['nut', 'cheese', 'beef', 'pork', 'lamb', 'veal', 'fish', 'cereal', 'beverage', 'seed', 'spice', 'oil', 'yogurt', 'chicken', 'turkey', 'bread', 'pasta', 'bean', 'squash', 'lettuce', 'cabbage', 'melon', 'crustacean', 'mollusk'])

/** Filler that shouldn't make a name look long ("broilers or fryers", "with added vitamin D"). */
const FILLER = new Set(['or', 'and', 'with', 'without', 'meat', 'only', 'broiler', 'fryer', 'added', 'vitamin', 'a', 'd', 'regular', 'enriched', 'unenriched', 'all', 'commercial', 'variety', 'in', 'of', 'n', 'ns', 'nf', 'nfs', 'fluid', 'as', 'purchased', 'the', 'to', 'not', 'fortified', 'milkfat', 'separable', 'lean', 'fat', 'skin', 'bone', 'removed', 'trimmed'])

/** Plain forms make the best default ("Bananas, raw", "Egg, whole, cooked, hard-boiled"). */
const PLAIN = new Set(['raw', 'fresh', 'whole', 'plain', 'cooked', 'boiled', 'roasted', 'brewed', 'baked', 'steamed'])

/** Processed or niche variants people rarely mean unless they type the word. */
const DETOUR = new Set([
  'dried', 'dehydrated', 'powder', 'canned', 'frozen', 'mix', 'imitation', 'flavor', 'flavored', 'oil', 'flour', 'juice', 'sauce', 'sliced', 'roll',
  'deli', 'luncheon', 'sweetened', 'dessert', 'pudding', 'pie', 'cake', 'cookie', 'candy', 'prepared', 'glutinous', 'buttermilk', 'sheep', 'goat',
  'human', 'formula', 'babyfood', 'baby', 'infant', 'restaurant', 'fast', 'school', 'usda', 'commodity', 'military', 'alaska', 'native', 'navajo',
  'hopi', 'apache', 'shoshone', 'substitute', 'nugget', 'dry', 'concentrate', 'stick', 'salted', 'soymilk', 'industrial', 'reduced', 'low',
  'nonfat', 'free', 'yolk', 'glutinou',
])

/** Everyday names that don't appear in USDA's wording. */
const SYNONYMS: Record<string, string[]> = {
  egg: ['egg whole'],
  rice: ['rice white long grain cooked'],
  'white rice': ['rice white long grain cooked'],
  oatmeal: ['cereals oats'],
  oat: ['cereals oats'],
  coffee: ['beverages coffee brewed'],
  tea: ['beverages tea brewed'],
  'chicken breast': ['chicken broilers or fryers breast'],
  'chicken thigh': ['chicken broilers or fryers thigh'],
  'ground beef': ['beef ground'],
  'ground turkey': ['turkey ground'],
  steak: ['beef steak'],
  pb: ['peanut butter'],
  oj: ['orange juice'],
  fries: ['potatoes french fried'],
}

/**
 * Score a food name for a query; 0 means no match. Every query word must start a word in the
 * name. Matches on the food itself (first part, or second after a category) rank highest, and
 * short, plain names beat processed or niche variants.
 */
export function scoreFoodName(name: string, query: string): number {
  const q = foodWords(query)
  if (q.length === 0) return 0
  const segments = name.split(',').map(foodWords).filter((s) => s.length)
  const all = segments.flat()
  if (!q.every((w) => all.some((t) => t.startsWith(w)))) return 0

  const meaningful = all.filter((t) => !FILLER.has(t) && !/^\d/.test(t))
  let score = 100 - meaningful.length * 3

  const head = segments[0] ?? []
  const food = CATEGORY_PREFIXES.has(head[0]) && head.length === 1 && segments[1] ? [...head, ...segments[1]] : head
  const inFood = (w: string) => food.some((t) => t.startsWith(w))
  if (inFood(q[0])) score += 40
  if (q.every(inFood)) score += 20
  if (head.length === q.length && q.every((w, i) => head[i] === w)) score += 15

  const typed = (t: string) => q.some((w) => t.startsWith(w))
  if (all.some((t) => PLAIN.has(t) && !typed(t))) score += 8
  score -= 12 * all.filter((t) => DETOUR.has(t) && !typed(t)).length
  // Upper-case brand names ("KELLOGG'S") mark branded items; generic ones make better defaults.
  if (/[A-Z]{3,}/.test(name)) score -= 15
  return Math.max(1, score)
}

export function searchUsdaFoods(query: string, foods: readonly UsdaFood[], limit = 25): UsdaFood[] {
  const key = foodWords(query).join(' ')
  if (!key) return []
  const queries = [query, ...(SYNONYMS[key] ?? [])]
  const best = new Map<number, { f: UsdaFood; s: number }>()
  for (const [i, q] of queries.entries()) {
    for (const f of foods) {
      // A synonym match counts as a strong direct match.
      const s = scoreFoodName(f[1], q) + (i > 0 ? 50 : 0)
      if (s > (i > 0 ? 50 : 0) && s > (best.get(f[0])?.s ?? 0)) best.set(f[0], { f, s })
    }
  }
  return [...best.values()]
    .sort((a, b) => b.s - a.s || a.f[1].length - b.f[1].length)
    .slice(0, limit)
    .map((x) => x.f)
}

/** Title-case the all-caps brand names USDA uses ("KELLOGG'S" → "Kellogg's"). */
export function prettyFoodName(name: string): string {
  return name.replace(/\b[A-Z]{2,}(?:'[A-Z]+)?\b/g, (w) => w[0] + w.slice(1).toLowerCase())
}
