import { describe, expect, it } from 'vitest'
import usda from '../data/seed/usdaFoods.json'
import { prettyFoodName, searchUsdaFoods } from './foodSearch'
import { defaultServingIndex, expandUpcE, mealForTime, normalizeBarcode, nutritionForGrams, parseOffProduct, scaleNutrition, sumNutrition, usdaPer100g, usdaServingOptions, type UsdaFood } from './nutrition'

const foods = usda.foods as UsdaFood[]
const top = (q: string) => searchUsdaFoods(q, foods, 1)[0]?.[1]

describe('nutrition math', () => {
  it('scales and sums', () => {
    const egg = { calories: 72, proteinG: 6.3, carbsG: 0.4, fatG: 4.8 }
    expect(scaleNutrition(egg, 2)).toEqual({ calories: 144, proteinG: 12.6, carbsG: 0.8, fatG: 9.6 })
    expect(sumNutrition([egg, egg]).calories).toBe(144)
    expect(sumNutrition([])).toEqual({ calories: 0, proteinG: 0, carbsG: 0, fatG: 0 })
  })

  it('computes USDA servings from per-100 g values', () => {
    const banana = foods.find((f) => f[1] === 'Bananas, raw')!
    const medium = usdaServingOptions(banana).find((o) => o.label.startsWith('1 medium'))!
    expect(medium).toEqual({ label: '1 medium (7" to 7-7/8" long) (118 g)', grams: 118 })
    expect(Math.round(nutritionForGrams(usdaPer100g(banana), medium.grams).calories)).toBe(105)
    expect(usdaServingOptions(banana).map((o) => o.label)).toEqual(expect.arrayContaining(['100 g', '1 oz (28 g)']))
  })
})

describe('built-in USDA list', () => {
  it('has thousands of foods with sane values', () => {
    expect(foods.length).toBeGreaterThan(7000)
    // Nothing beats pure fat (~900 kcal/100 g), and macros can't exceed the food's weight.
    const insane = foods.filter((f) => f[2] < 0 || f[2] >= 950 || f[3] + f[4] + f[5] > 101)
    expect(insane).toEqual([])
  })

  it.each([
    ['banana', 'Bananas, raw'],
    ['bananas', 'Bananas, raw'],
    ['broccoli', 'Broccoli, raw'],
    ['egg', 'Egg, whole, raw, fresh'],
    ['almonds', 'Nuts, almonds'],
    ['olive oil', 'Oil, olive, salad or cooking'],
    ['rice', 'Rice, white, long-grain, regular, enriched, cooked'],
  ])('"%s" → %s first', (query, expected) => {
    expect(top(query)).toBe(expected)
  })

  it.each([
    ['chicken breast', /^Chicken, broilers or fryers, breast/],
    ['milk', /^Milk, whole/],
    ['greek yogurt', /^Yogurt, Greek/],
    ['coffee', /^Beverages, coffee, brewed/],
    ['oatmeal', /^Cereals, oats/],
    ['ground beef', /^Beef, ground/],
  ])('"%s" finds the everyday food first', (query, pattern) => {
    expect(top(query)).toMatch(pattern)
  })

  it('requires every word and returns nothing for nonsense', () => {
    expect(searchUsdaFoods('banana xyzzy', foods)).toEqual([])
    expect(searchUsdaFoods('   ', foods)).toEqual([])
  })

  it('title-cases brand names', () => {
    expect(prettyFoodName("Cereals ready-to-eat, KELLOGG'S RAISIN BRAN")).toBe("Cereals ready-to-eat, Kellogg's Raisin Bran")
  })
})

describe('normalizeBarcode', () => {
  it('writes UPC-A as 13-digit EAN and strips non-digits', () => {
    expect(normalizeBarcode('012345678905')).toBe('0012345678905')
    expect(normalizeBarcode('0012345678905')).toBe('0012345678905')
    expect(normalizeBarcode(' 4006-3810 ')).toBe('40063810')
  })
})

describe('expandUpcE', () => {
  it.each([
    ['04252614', '042100005264'], // last digit 0–2
    ['01234531', '012300000451'], // 3
    ['01234544', '012340000054'], // 4
    ['01234558', '012345000058'], // 5–9
  ])('%s → %s', (upcE, upcA) => {
    expect(expandUpcE(upcE)).toBe(upcA)
  })

  it('leaves other codes alone', () => {
    expect(expandUpcE('96385074')).toBe('96385074') // EAN-8 starting with 9
    expect(expandUpcE('0012345678905')).toBe('0012345678905')
  })
})

describe('parseOffProduct', () => {
  it('prefers per-serving values from the label', () => {
    const p = parseOffProduct({
      product_name: 'Nutella',
      brands: 'Ferrero',
      serving_size: '15 g',
      serving_quantity: 15,
      nutriments: { 'energy-kcal_serving': 80, proteins_serving: 0.9, carbohydrates_serving: 8.6, fat_serving: 4.6, 'energy-kcal_100g': 539 },
    })
    expect(p).toEqual({ name: 'Nutella (Ferrero)', servingSize: '15 g', nutrition: { calories: 80, proteinG: 0.9, carbsG: 8.6, fatG: 4.6 } })
  })

  it('scales per-100 g values to the serving weight', () => {
    const p = parseOffProduct({ product_name: 'Oats', serving_quantity: 40, nutriments: { 'energy-kcal_100g': 375, proteins_100g: 13, carbohydrates_100g: 60, fat_100g: 7 } })
    expect(p?.servingSize).toBe('40 g')
    const n = p!.nutrition!
    expect([n.calories, n.proteinG, n.carbsG, n.fatG].map((v) => +v.toFixed(2))).toEqual([150, 5.2, 24, 2.8])
  })

  it('falls back to 100 g, and converts kJ when kcal is missing', () => {
    const p = parseOffProduct({ product_name: 'Juice', nutriments: { energy_100g: 184 } })
    expect(p?.servingSize).toBe('100 g')
    expect(Math.round(p!.nutrition!.calories)).toBe(44)
  })

  it('flags missing nutrition so the user can enter it', () => {
    expect(parseOffProduct({ product_name: 'Mystery bar', nutriments: {} })?.nutrition).toBeNull()
    expect(parseOffProduct(null)).toBeNull()
  })

  it('does not repeat a brand already in the name', () => {
    expect(parseOffProduct({ product_name: 'Chobani Greek Yogurt', brands: 'Chobani', nutriments: { 'energy-kcal_100g': 60 } })?.name).toBe('Chobani Greek Yogurt')
  })
})

describe('mealForTime', () => {
  it.each([
    [7, 0, 'breakfast'],
    [10, 45, 'snacks'],
    [12, 30, 'lunch'],
    [15, 30, 'snacks'],
    [18, 0, 'dinner'],
    [23, 0, 'snacks'],
  ])('%i:%i → %s', (h, m, meal) => {
    expect(mealForTime(new Date(2026, 8, 28, h, m))).toBe(meal)
  })
})

describe('defaultServingIndex', () => {
  it('prefers a medium size, then the label serving', () => {
    const banana = foods.find((f) => f[1] === 'Bananas, raw')!
    const opts = usdaServingOptions(banana)
    expect(opts[defaultServingIndex(opts)].label).toMatch(/^1 medium/)
    const rice = foods.find((f) => f[1] === 'Rice, white, long-grain, regular, enriched, cooked')!
    expect(usdaServingOptions(rice)[defaultServingIndex(usdaServingOptions(rice))].label).toBe('1 cup (158 g)')
  })
})
