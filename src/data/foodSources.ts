import { prettyFoodName, searchUsdaFoods } from '../domain/foodSearch'
import { type ParsedProduct, type UsdaFood, normalizeBarcode, parseOffProduct } from '../domain/nutrition'
import { getCached, setCached } from './repositories/mealRepo'

// ----- Built-in USDA list -----

let usdaPromise: Promise<UsdaFood[]> | null = null

/** Load the built-in USDA list on first use (a separate ~200 KB chunk, cached offline by the service worker). */
export function loadUsdaFoods(): Promise<UsdaFood[]> {
  usdaPromise ??= import('./seed/usdaFoods.json').then((m) => m.default.foods as UsdaFood[]).catch((e: unknown) => {
    usdaPromise = null
    throw e
  })
  return usdaPromise
}

export async function searchUsda(query: string, limit = 25): Promise<UsdaFood[]> {
  return searchUsdaFoods(query, await loadUsdaFoods(), limit)
}

export const usdaDisplayName = (food: UsdaFood) => prettyFoodName(food[1])

// ----- Open Food Facts -----

const OFF = 'https://world.openfoodfacts.org'
const FIELDS = 'code,product_name,brands,serving_size,serving_quantity,nutriments'

export class LookupError extends Error {
  readonly reason: 'offline' | 'unavailable'
  constructor(reason: 'offline' | 'unavailable') {
    super(reason === 'offline' ? 'You’re offline.' : 'Open Food Facts isn’t responding right now.')
    this.reason = reason
  }
}

async function getJson(url: string): Promise<unknown> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new LookupError('offline')
  let res: Response
  try {
    res = await fetch(url, { headers: { Accept: 'application/json' } })
  } catch {
    throw new LookupError(typeof navigator !== 'undefined' && navigator.onLine === false ? 'offline' : 'unavailable')
  }
  if (res.status === 404) return null
  if (!res.ok) throw new LookupError('unavailable')
  try {
    return await res.json()
  } catch {
    throw new LookupError('unavailable')
  }
}

export interface BarcodeResult {
  status: 'found' | 'noNutrition' | 'notFound'
  product?: ParsedProduct
}

/** Look a barcode up on Open Food Facts. Results are cached for 30 days. */
export async function lookupBarcodeOnline(code: string): Promise<BarcodeResult> {
  const barcode = normalizeBarcode(code)
  const key = `off:barcode:${barcode}`
  const cached = await getCached<BarcodeResult>(key, 30)
  if (cached) return cached
  const json = (await getJson(`${OFF}/api/v2/product/${barcode}.json?fields=${FIELDS}`)) as { status?: number; product?: Record<string, unknown> } | null
  const product = json && json.status !== 0 ? parseOffProduct(json.product) : null
  const result: BarcodeResult = !product ? { status: 'notFound' } : product.nutrition ? { status: 'found', product } : { status: 'noNutrition', product }
  await setCached(key, result)
  return result
}

export interface PackagedResult extends ParsedProduct {
  barcode: string
}

/**
 * Best-effort text search for packaged foods. Open Food Facts limits search to a few requests a
 * minute and its search service is sometimes down, so callers should treat failure as normal.
 */
export async function searchPackagedOnline(query: string): Promise<PackagedResult[]> {
  const q = query.trim().toLowerCase()
  const key = `off:search:${q}`
  const cached = await getCached<PackagedResult[]>(key, 7)
  if (cached) return cached
  const url = `${OFF}/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=20&fields=${FIELDS}`
  const json = (await getJson(url)) as { products?: Record<string, unknown>[] } | null
  const results = (json?.products ?? [])
    .map((p) => ({ parsed: parseOffProduct(p), code: typeof p.code === 'string' ? p.code : '' }))
    .filter((r): r is { parsed: ParsedProduct; code: string } => !!r.parsed?.nutrition && !!r.code)
    .map((r) => ({ ...r.parsed, barcode: normalizeBarcode(r.code) }))
  await setCached(key, results)
  return results
}
