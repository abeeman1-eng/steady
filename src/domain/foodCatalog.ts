/**
 * Everyday foods used for plans and recommendations, keyed to the built-in USDA list (nutrition
 * is always read from USDA, never typed here). Portions are in grams with realistic steps, e.g.
 * one egg (50 g) or one slice of bread (28 g).
 */

export type FoodRole = 'protein' | 'carb' | 'fat' | 'veg' | 'fruit'
export type DietTag = 'meat' | 'fish' | 'egg' | 'dairy' | 'plant'
export type DietStyle = 'any' | 'pescatarian' | 'vegetarian' | 'vegan'

export const DIET_STYLES: { value: DietStyle; label: string; hint: string }[] = [
  { value: 'any', label: 'No restrictions', hint: 'Meat, fish, eggs, dairy and plants' },
  { value: 'pescatarian', label: 'Pescatarian', hint: 'Fish, eggs and dairy, but no meat' },
  { value: 'vegetarian', label: 'Vegetarian', hint: 'Eggs and dairy, but no meat or fish' },
  { value: 'vegan', label: 'Vegan', hint: 'Plants only' },
]

const ALLOWED: Record<DietStyle, DietTag[]> = {
  any: ['meat', 'fish', 'egg', 'dairy', 'plant'],
  pescatarian: ['fish', 'egg', 'dairy', 'plant'],
  vegetarian: ['egg', 'dairy', 'plant'],
  vegan: ['plant'],
}

export const allowedFor = (style: DietStyle, food: CatalogFood) => ALLOWED[style].includes(food.diet)

export interface CatalogFood {
  id: string
  fdcId: number
  name: string
  /** Used in meal names, e.g. "{protein} rice bowl" → "Tofu rice bowl". */
  short?: string
  role: FoodRole
  diet: DietTag
  /** Grams per step and the sensible range for one meal. */
  step: number
  min: number
  max: number
  /** A countable unit for display, e.g. { name: 'egg', grams: 50 } → "2 eggs (100 g)". */
  unit?: { name: string; plural?: string; grams: number }
}

export const CATALOG: CatalogFood[] = [
  // Protein
  { id: 'chicken-breast', fdcId: 171477, name: 'Chicken breast, roasted', short: 'Chicken', role: 'protein', diet: 'meat', step: 25, min: 75, max: 325 },
  { id: 'chicken-thigh', fdcId: 172388, name: 'Chicken thigh, roasted', short: 'Chicken thigh', role: 'protein', diet: 'meat', step: 25, min: 75, max: 275 },
  { id: 'lean-beef', fdcId: 174752, name: 'Lean ground beef (93%), cooked', short: 'Beef', role: 'protein', diet: 'meat', step: 25, min: 75, max: 275 },
  { id: 'sirloin', fdcId: 169457, name: 'Sirloin steak, broiled', short: 'Steak', role: 'protein', diet: 'meat', step: 25, min: 100, max: 300 },
  { id: 'salmon', fdcId: 175168, name: 'Salmon, cooked', short: 'Salmon', role: 'protein', diet: 'fish', step: 25, min: 75, max: 275 },
  { id: 'tuna', fdcId: 173709, name: 'Tuna, canned in water', short: 'Tuna', role: 'protein', diet: 'fish', step: 20, min: 60, max: 165 },
  { id: 'cod', fdcId: 171956, name: 'Cod, cooked', short: 'Cod', role: 'protein', diet: 'fish', step: 25, min: 100, max: 300 },
  { id: 'shrimp', fdcId: 175180, name: 'Shrimp, cooked', short: 'Shrimp', role: 'protein', diet: 'fish', step: 25, min: 75, max: 275 },
  { id: 'eggs', fdcId: 173424, name: 'Eggs, hard-boiled', short: 'Eggs', role: 'protein', diet: 'egg', step: 50, min: 50, max: 200, unit: { name: 'egg', grams: 50 } },
  { id: 'egg-whites', fdcId: 172183, name: 'Egg whites', short: 'Egg white', role: 'protein', diet: 'egg', step: 33, min: 99, max: 264, unit: { name: 'egg white', grams: 33 } },
  { id: 'greek-yogurt', fdcId: 170894, name: 'Greek yogurt, plain nonfat', short: 'Greek yogurt', role: 'protein', diet: 'dairy', step: 50, min: 100, max: 400 },
  { id: 'cottage-cheese', fdcId: 172182, name: 'Cottage cheese, 2%', short: 'Cottage cheese', role: 'protein', diet: 'dairy', step: 50, min: 100, max: 350 },
  { id: 'whey', fdcId: 173180, name: 'Whey protein powder', short: 'Whey', role: 'protein', diet: 'dairy', step: 15, min: 15, max: 60, unit: { name: 'scoop', grams: 30 } },
  { id: 'milk', fdcId: 171267, name: 'Milk, 2%', short: 'Milk', role: 'protein', diet: 'dairy', step: 60, min: 120, max: 360, unit: { name: 'cup', grams: 240 } },
  { id: 'tofu', fdcId: 172475, name: 'Firm tofu', short: 'Tofu', role: 'protein', diet: 'plant', step: 25, min: 100, max: 350 },
  { id: 'edamame', fdcId: 168411, name: 'Edamame', short: 'Edamame', role: 'protein', diet: 'plant', step: 25, min: 75, max: 200 },
  { id: 'lentils', fdcId: 172421, name: 'Lentils, cooked', short: 'Lentil', role: 'protein', diet: 'plant', step: 25, min: 100, max: 400 },
  { id: 'chickpeas', fdcId: 173757, name: 'Chickpeas, cooked', short: 'Chickpea', role: 'protein', diet: 'plant', step: 25, min: 75, max: 350 },
  { id: 'black-beans', fdcId: 173735, name: 'Black beans, cooked', short: 'Black bean', role: 'protein', diet: 'plant', step: 25, min: 75, max: 350 },

  // Carbs
  { id: 'oats', fdcId: 173904, name: 'Rolled oats (dry)', role: 'carb', diet: 'plant', step: 10, min: 30, max: 150 },
  { id: 'white-rice', fdcId: 168878, name: 'White rice, cooked', role: 'carb', diet: 'plant', step: 25, min: 75, max: 450 },
  { id: 'brown-rice', fdcId: 169704, name: 'Brown rice, cooked', role: 'carb', diet: 'plant', step: 25, min: 75, max: 450 },
  { id: 'potato', fdcId: 170093, name: 'Baked potato', role: 'carb', diet: 'plant', step: 25, min: 100, max: 500 },
  { id: 'sweet-potato', fdcId: 168483, name: 'Sweet potato, baked', role: 'carb', diet: 'plant', step: 25, min: 100, max: 500 },
  { id: 'pasta', fdcId: 169737, name: 'Pasta, cooked', role: 'carb', diet: 'plant', step: 25, min: 75, max: 450 },
  { id: 'quinoa', fdcId: 168917, name: 'Quinoa, cooked', role: 'carb', diet: 'plant', step: 25, min: 75, max: 400 },
  { id: 'wholewheat-bread', fdcId: 172688, name: 'Whole-wheat bread', role: 'carb', diet: 'plant', step: 28, min: 28, max: 140, unit: { name: 'slice', grams: 28 } },
  { id: 'tortilla', fdcId: 175037, name: 'Flour tortilla', role: 'carb', diet: 'plant', step: 45, min: 45, max: 135, unit: { name: 'tortilla', grams: 45 } },

  // Fruit
  { id: 'banana', fdcId: 173944, name: 'Banana', role: 'fruit', diet: 'plant', step: 118, min: 118, max: 236, unit: { name: 'medium banana', plural: 'medium bananas', grams: 118 } },
  { id: 'apple', fdcId: 171688, name: 'Apple', role: 'fruit', diet: 'plant', step: 182, min: 182, max: 182, unit: { name: 'medium apple', grams: 182 } },
  { id: 'blueberries', fdcId: 171711, name: 'Blueberries', role: 'fruit', diet: 'plant', step: 37, min: 74, max: 148 },
  { id: 'strawberries', fdcId: 167762, name: 'Strawberries', role: 'fruit', diet: 'plant', step: 50, min: 100, max: 200 },
  { id: 'orange', fdcId: 169097, name: 'Orange', role: 'fruit', diet: 'plant', step: 131, min: 131, max: 131, unit: { name: 'orange', grams: 131 } },

  // Vegetables
  { id: 'broccoli', fdcId: 169967, name: 'Broccoli, cooked', role: 'veg', diet: 'plant', step: 30, min: 90, max: 180 },
  { id: 'spinach', fdcId: 168462, name: 'Spinach', role: 'veg', diet: 'plant', step: 30, min: 30, max: 90 },
  { id: 'carrots', fdcId: 170393, name: 'Carrots', role: 'veg', diet: 'plant', step: 30, min: 60, max: 120 },
  { id: 'red-pepper', fdcId: 170108, name: 'Red bell pepper', role: 'veg', diet: 'plant', step: 30, min: 60, max: 150 },

  // Fats
  { id: 'avocado', fdcId: 171705, name: 'Avocado', role: 'fat', diet: 'plant', step: 25, min: 25, max: 150 },
  { id: 'almonds', fdcId: 170567, name: 'Almonds', role: 'fat', diet: 'plant', step: 7, min: 14, max: 56 },
  { id: 'peanut-butter', fdcId: 174266, name: 'Peanut butter', role: 'fat', diet: 'plant', step: 8, min: 16, max: 64, unit: { name: 'tbsp', grams: 16 } },
  { id: 'olive-oil', fdcId: 171413, name: 'Olive oil', role: 'fat', diet: 'plant', step: 5, min: 5, max: 30, unit: { name: 'tsp', grams: 5 } },
  { id: 'chia', fdcId: 170554, name: 'Chia seeds', role: 'fat', diet: 'plant', step: 6, min: 6, max: 24, unit: { name: 'tbsp', grams: 12 } },
  { id: 'cheddar', fdcId: 173414, name: 'Cheddar cheese', role: 'fat', diet: 'dairy', step: 14, min: 14, max: 56 },
  { id: 'hummus', fdcId: 174289, name: 'Hummus', role: 'fat', diet: 'plant', step: 15, min: 30, max: 120 },
]

export const CATALOG_BY_ID: ReadonlyMap<string, CatalogFood> = new Map(CATALOG.map((f) => [f.id, f]))

export type MealKind = 'breakfast' | 'lunch' | 'dinner' | 'snacks'

export interface MealTemplate {
  id: string
  /** May contain {protein}, filled with the short name of the protein actually used. */
  name: string
  meal: MealKind
  /** Each slot lists foods in order of preference; the first one allowed by the diet style is used. */
  slots: { role: FoodRole; options: string[] }[]
}

export const TEMPLATES: MealTemplate[] = [
  // Breakfast
  { id: 'yogurt-bowl', name: 'Yogurt bowl', meal: 'breakfast', slots: [{ role: 'protein', options: ['greek-yogurt'] }, { role: 'carb', options: ['oats'] }, { role: 'fruit', options: ['blueberries'] }, { role: 'fat', options: ['chia', 'almonds'] }] },
  { id: 'eggs-toast', name: '{protein} on toast', meal: 'breakfast', slots: [{ role: 'protein', options: ['eggs', 'tofu'] }, { role: 'carb', options: ['wholewheat-bread'] }, { role: 'fruit', options: ['orange'] }, { role: 'fat', options: ['avocado'] }] },
  { id: 'protein-oats', name: 'Protein oatmeal', meal: 'breakfast', slots: [{ role: 'protein', options: ['whey', 'milk'] }, { role: 'carb', options: ['oats'] }, { role: 'fruit', options: ['banana'] }, { role: 'fat', options: ['peanut-butter'] }] },
  { id: 'tofu-scramble', name: 'Tofu scramble & toast', meal: 'breakfast', slots: [{ role: 'protein', options: ['tofu'] }, { role: 'veg', options: ['spinach'] }, { role: 'carb', options: ['wholewheat-bread'] }, { role: 'fat', options: ['avocado'] }] },

  // Lunch
  { id: 'chicken-rice-bowl', name: '{protein} rice bowl', meal: 'lunch', slots: [{ role: 'protein', options: ['chicken-breast', 'shrimp', 'tofu'] }, { role: 'carb', options: ['white-rice', 'brown-rice'] }, { role: 'veg', options: ['broccoli'] }, { role: 'fat', options: ['olive-oil'] }] },
  { id: 'tuna-wrap', name: '{protein} wrap', meal: 'lunch', slots: [{ role: 'protein', options: ['tuna', 'chickpeas'] }, { role: 'carb', options: ['tortilla'] }, { role: 'veg', options: ['spinach'] }, { role: 'fat', options: ['avocado'] }] },
  { id: 'lentil-quinoa', name: 'Lentil & quinoa bowl', meal: 'lunch', slots: [{ role: 'protein', options: ['lentils'] }, { role: 'carb', options: ['quinoa'] }, { role: 'veg', options: ['red-pepper'] }, { role: 'fat', options: ['olive-oil'] }] },
  { id: 'beef-burrito-bowl', name: 'Burrito bowl', meal: 'lunch', slots: [{ role: 'protein', options: ['lean-beef', 'chicken-thigh', 'black-beans'] }, { role: 'carb', options: ['brown-rice'] }, { role: 'veg', options: ['red-pepper'] }, { role: 'fat', options: ['avocado', 'cheddar'] }] },

  // Dinner
  { id: 'salmon-potato', name: '{protein}, potato & broccoli', meal: 'dinner', slots: [{ role: 'protein', options: ['salmon', 'cod', 'tofu'] }, { role: 'carb', options: ['potato'] }, { role: 'veg', options: ['broccoli'] }, { role: 'fat', options: ['olive-oil'] }] },
  { id: 'beef-pasta', name: '{protein} & pepper pasta', meal: 'dinner', slots: [{ role: 'protein', options: ['lean-beef', 'shrimp', 'lentils'] }, { role: 'carb', options: ['pasta'] }, { role: 'veg', options: ['red-pepper'] }, { role: 'fat', options: ['olive-oil'] }] },
  { id: 'steak-sweet-potato', name: '{protein} & sweet potato', meal: 'dinner', slots: [{ role: 'protein', options: ['sirloin', 'chicken-thigh', 'cod', 'black-beans'] }, { role: 'carb', options: ['sweet-potato'] }, { role: 'veg', options: ['spinach'] }, { role: 'fat', options: ['olive-oil'] }] },
  { id: 'tofu-stir-fry', name: 'Tofu stir-fry', meal: 'dinner', slots: [{ role: 'protein', options: ['tofu'] }, { role: 'carb', options: ['white-rice'] }, { role: 'veg', options: ['broccoli'] }, { role: 'fat', options: ['olive-oil'] }] },

  // Snacks
  { id: 'cottage-fruit', name: '{protein} & berries', meal: 'snacks', slots: [{ role: 'protein', options: ['cottage-cheese', 'greek-yogurt', 'edamame'] }, { role: 'fruit', options: ['strawberries'] }] },
  { id: 'apple-pb', name: 'Apple & peanut butter', meal: 'snacks', slots: [{ role: 'fruit', options: ['apple'] }, { role: 'fat', options: ['peanut-butter'] }] },
  { id: 'hummus-carrots', name: 'Hummus & carrots', meal: 'snacks', slots: [{ role: 'fat', options: ['hummus'] }, { role: 'veg', options: ['carrots'] }] },
  { id: 'shake', name: 'Protein shake', meal: 'snacks', slots: [{ role: 'protein', options: ['whey'] }, { role: 'fruit', options: ['banana'] }] },
  { id: 'almonds-banana', name: 'Almonds & a banana', meal: 'snacks', slots: [{ role: 'fruit', options: ['banana'] }, { role: 'fat', options: ['almonds'] }] },
  { id: 'pb-banana-toast', name: 'Peanut butter banana toast', meal: 'snacks', slots: [{ role: 'carb', options: ['wholewheat-bread'] }, { role: 'fat', options: ['peanut-butter'] }, { role: 'fruit', options: ['banana'] }] },
  { id: 'yogurt-parfait', name: 'Yogurt parfait', meal: 'snacks', slots: [{ role: 'protein', options: ['greek-yogurt'] }, { role: 'carb', options: ['oats'] }, { role: 'fruit', options: ['blueberries'] }] },
]

/** Default share of the day's targets for each meal. */
export const MEAL_SHARES: Record<MealKind, number> = { breakfast: 0.25, lunch: 0.3, dinner: 0.3, snacks: 0.15 }
