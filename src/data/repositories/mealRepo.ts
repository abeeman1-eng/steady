import { type MealType, type Nutrition, normalizeBarcode, pickNutrition } from '../../domain/nutrition'
import { db } from '../db'
import { stamp, touch } from '../records'
import type { FoodRecord, MealEntryRecord, SavedMealRecord } from '../schema'

export const RECENT_LIMIT = 20

export type NewFood = Nutrition & {
  name: string
  servingSize: string
  source: FoodRecord['source']
  barcode?: string
  externalId?: string
}

/**
 * Save a food, reusing the existing record for the same database item or barcode so Recent and
 * Favorites don't fill with duplicates. Returns the food id.
 */
export async function upsertFood(food: NewFood): Promise<string> {
  const barcode = food.barcode ? normalizeBarcode(food.barcode) : undefined
  return db.transaction('rw', db.foods, async () => {
    const existing =
      (food.externalId && (await db.foods.where('externalId').equals(food.externalId).first())) ||
      (barcode && (await db.foods.where('barcode').equals(barcode).first())) ||
      undefined
    const fields = { ...food, barcode }
    if (existing) {
      await db.foods.update(existing.id, touch(fields))
      return existing.id
    }
    const record: FoodRecord = stamp({ ...fields, isFavorite: false })
    await db.foods.add(record)
    return record.id
  })
}

export async function findFoodByBarcode(code: string): Promise<FoodRecord | null> {
  return (await db.foods.where('barcode').equals(normalizeBarcode(code)).first()) ?? null
}

export const getFood = (id: string) => db.foods.get(id)

export async function setFavorite(foodId: string, isFavorite: boolean): Promise<void> {
  await db.foods.update(foodId, touch({ isFavorite }))
}

export async function listFavoriteFoods(): Promise<FoodRecord[]> {
  return (await db.foods.filter((f) => f.isFavorite).toArray()).sort((a, b) => a.name.localeCompare(b.name))
}

/** Foods the user has saved or logged whose name contains every typed word. */
export async function searchMyFoods(query: string): Promise<FoodRecord[]> {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (words.length === 0) return []
  const matches = await db.foods.filter((f) => words.every((w) => f.name.toLowerCase().includes(w))).toArray()
  return matches.sort((a, b) => Number(b.isFavorite) - Number(a.isFavorite) || a.name.length - b.name.length).slice(0, 20)
}

/** The last 20 different foods logged, most recent first. */
export async function listRecentFoods(limit = RECENT_LIMIT): Promise<FoodRecord[]> {
  const ids: string[] = []
  await db.mealEntries
    .orderBy('createdAt')
    .reverse()
    .until(() => ids.length >= limit)
    .each((e) => {
      if (!ids.includes(e.foodId)) ids.push(e.foodId)
    })
  const foods = await db.foods.bulkGet(ids)
  return foods.filter((f): f is FoodRecord => !!f)
}

/** Log a food to a meal, copying its name, serving and nutrition onto the entry. */
export async function logFood(date: string, mealType: MealType, foodId: string, servings: number): Promise<string> {
  const food = await db.foods.get(foodId)
  if (!food) throw new Error('That food no longer exists.')
  const entry: MealEntryRecord = stamp({
    date,
    mealType,
    foodId,
    servings,
    name: food.name,
    servingSize: food.servingSize,
    ...pickNutrition(food),
  })
  await db.mealEntries.add(entry)
  return entry.id
}

export async function getEntriesForDate(date: string): Promise<MealEntryRecord[]> {
  const entries = await db.mealEntries.where('date').equals(date).toArray()
  return entries.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export async function updateEntryServings(entryId: string, servings: number): Promise<void> {
  await db.mealEntries.update(entryId, touch({ servings }))
}

export async function moveEntry(entryId: string, mealType: MealType): Promise<void> {
  await db.mealEntries.update(entryId, touch({ mealType }))
}

export const deleteEntry = (entryId: string) => db.mealEntries.delete(entryId)

// ----- Favorite meals -----

export async function saveMealAsFavorite(name: string, entries: Pick<MealEntryRecord, 'foodId' | 'servings'>[]): Promise<string> {
  const meal: SavedMealRecord = stamp({ name: name.trim() || 'My meal', items: entries.map((e) => ({ foodId: e.foodId, servings: e.servings })) })
  await db.savedMeals.add(meal)
  return meal.id
}

export async function listSavedMeals(): Promise<SavedMealRecord[]> {
  return (await db.savedMeals.toArray()).sort((a, b) => a.name.localeCompare(b.name))
}

export const deleteSavedMeal = (id: string) => db.savedMeals.delete(id)

/** Log every food in a favorite meal. Foods deleted since it was saved are skipped. */
export async function logSavedMeal(mealId: string, date: string, mealType: MealType): Promise<number> {
  const meal = await db.savedMeals.get(mealId)
  if (!meal) return 0
  let logged = 0
  for (const item of meal.items) {
    if (await db.foods.get(item.foodId)) {
      await logFood(date, mealType, item.foodId, item.servings)
      logged++
    }
  }
  return logged
}

// ----- Lookup cache (Open Food Facts) -----

const CACHE_LIMIT = 200

export async function getCached<T>(key: string, maxAgeDays: number): Promise<T | undefined> {
  const hit = await db.lookupCache.get(key)
  if (!hit) return undefined
  const ageMs = Date.now() - new Date(hit.fetchedAt).getTime()
  return ageMs <= maxAgeDays * 86_400_000 ? (hit.value as T) : undefined
}

export async function setCached(key: string, value: unknown): Promise<void> {
  await db.lookupCache.put({ id: key, value, fetchedAt: new Date().toISOString() })
  const count = await db.lookupCache.count()
  if (count > CACHE_LIMIT) {
    const oldest = await db.lookupCache.orderBy('fetchedAt').limit(count - CACHE_LIMIT).primaryKeys()
    await db.lookupCache.bulkDelete(oldest)
  }
}
