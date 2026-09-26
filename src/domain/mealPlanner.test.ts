import { describe, expect, it } from 'vitest'
import usda from '../data/seed/usdaFoods.json'
import { CATALOG, type DietStyle, TEMPLATES, allowedFor } from './foodCatalog'
import { MEAL_ORDER, mealIdeas, mealTarget, planDay, portionLabel, rankGaps, recommendFoods, resolveTemplate, type Per100 } from './mealPlanner'
import { type UsdaFood, sumNutrition, usdaPer100g } from './nutrition'
import { suggestTargets } from './targets'

const byId = new Map((usda.foods as UsdaFood[]).map((f) => [f[0], f]))
const per100: Per100 = (id) => {
  const f = byId.get(id)
  return f ? usdaPer100g(f) : undefined
}

const DIETS: DietStyle[] = ['any', 'pescatarian', 'vegetarian', 'vegan']
const woman = suggestTargets({ sex: 'female', age: 31, heightCm: 168, weightKg: 68, activity: 'moderate', goals: ['strength'] }).targets
const man = suggestTargets({ sex: 'male', age: 45, heightCm: 180, weightKg: 95, activity: 'light', goals: ['weightLoss'] }).targets

describe('food catalog', () => {
  it('every food exists in the built-in USDA list with sensible portions', () => {
    for (const f of CATALOG) {
      expect(per100(f.fdcId), f.id).toBeDefined()
      expect(f.min).toBeLessThanOrEqual(f.max)
      expect(f.step).toBeGreaterThan(0)
    }
  })

  it('every template references real foods and every diet has ideas for every meal', () => {
    for (const t of TEMPLATES) for (const s of t.slots) for (const id of s.options) expect(CATALOG.some((f) => f.id === id), `${t.id} → ${id}`).toBe(true)
    for (const diet of DIETS) for (const meal of MEAL_ORDER) expect(TEMPLATES.filter((t) => t.meal === meal && resolveTemplate(t, diet)).length, `${diet} ${meal}`).toBeGreaterThanOrEqual(2)
  })
})

describe('planDay', () => {
  it.each(DIETS.flatMap((d) => [[d, 'woman', woman], [d, 'man', man]] as const))('%s plan for the %s lands near the targets', (diet, _who, targets) => {
    for (const variant of [0, 1, 2]) {
      const day = planDay(targets, diet, per100, variant)
      const totals = sumNutrition(MEAL_ORDER.map((m) => day[m].totals))
      expect(Math.abs(totals.calories - targets.calories) / targets.calories).toBeLessThan(0.1)
      // Falling short on protein matters; a little over is fine. Plant proteins come with carbs, so
      // vegan days are allowed a wider shortfall.
      const short = (targets.proteinG - totals.proteinG) / targets.proteinG
      expect(short).toBeLessThan(diet === 'vegan' ? 0.25 : 0.15)
      expect(-short).toBeLessThan(0.35)
    }
  })

  it('respects the diet style', () => {
    for (const diet of DIETS) {
      const day = planDay(woman, diet, per100)
      for (const m of MEAL_ORDER) for (const item of day[m].items) expect(allowedFor(diet, item.food), `${diet}: ${item.food.id}`).toBe(true)
    }
  })

  it('names meals after the protein actually used', () => {
    const meatWords = /chicken|beef|steak|salmon|tuna|cod|shrimp/i
    for (const diet of ['vegetarian', 'vegan'] as const) {
      for (const v of [0, 1, 2, 3]) {
        const day = planDay(woman, diet, per100, v)
        for (const m of MEAL_ORDER) {
          expect(day[m].name, `${diet}: ${day[m].name}`).not.toMatch(meatWords)
          expect(day[m].name).not.toContain('{protein}')
        }
      }
    }
    const lunch = mealIdeas('lunch', mealTarget(woman, 'lunch'), 'any', per100, 4).map((m) => m.name)
    expect(lunch).toContain('Chicken rice bowl')
  })

  it('uses realistic portions (whole eggs, slices, steps)', () => {
    const day = planDay(woman, 'any', per100)
    for (const m of MEAL_ORDER) {
      for (const { food, grams } of day[m].items) {
        expect(grams).toBeGreaterThanOrEqual(food.min)
        expect(grams).toBeLessThanOrEqual(food.max)
        expect(Math.abs(((grams - food.min) / food.step) % 1)).toBeLessThan(1e-9)
      }
    }
  })

  it('avoids repeating a protein at lunch and dinner', () => {
    for (const diet of ['any', 'vegetarian'] as const) {
      for (const v of [0, 1, 2]) {
        const day = planDay(woman, diet, per100, v)
        const protein = (m: 'lunch' | 'dinner') => day[m].items.find((i) => i.food.role === 'protein')?.food.id
        expect(protein('lunch'), `${diet} v${v}`).not.toBe(protein('dinner'))
      }
    }
  })

  it('variants give different days', () => {
    const names = (v: number) => MEAL_ORDER.map((m) => planDay(woman, 'any', per100, v)[m].template.id).join()
    expect(names(0)).not.toBe(names(1))
  })
})

describe('mealIdeas', () => {
  it('ranks ideas by fit to the meal budget', () => {
    const ideas = mealIdeas('lunch', mealTarget(woman, 'lunch'), 'any', per100)
    expect(ideas.length).toBeGreaterThanOrEqual(2)
    expect(ideas[0].error).toBeLessThanOrEqual(ideas[1].error)
  })
})

describe('recommendFoods', () => {
  const eaten = { calories: 900, proteinG: 30, carbsG: 120, fatG: 30, fiberG: 12 }

  it('targets the biggest gap with a varied mix of everyday protein foods', () => {
    const rec = recommendFoods(eaten, woman, 'any', per100)!
    expect(rec.focus).toBe('proteinG')
    expect(rec.remaining).toBe(woman.proteinG - 30)
    const ids = rec.items.map((i) => i.food.id)
    expect(ids).toEqual(expect.arrayContaining(['chicken-breast', 'lean-beef']))
    for (const i of rec.items) expect(i.food.role).toBe('protein')
    // Variety: meat, fish, egg or dairy, and plant all represented.
    expect(new Set(rec.items.map((i) => (i.food.diet === 'egg' || i.food.diet === 'dairy' ? 'eggDairy' : i.food.diet))).size).toBe(4)
  })

  it('suggests plant proteins for vegans', () => {
    const rec = recommendFoods(eaten, woman, 'vegan', per100)!
    for (const i of rec.items) expect(i.food.diet).toBe('plant')
    expect(rec.items.map((i) => i.food.id)).toContain('tofu')
  })

  it('never suggests more calories than are left', () => {
    const nearlyDone = { ...eaten, calories: woman.calories - 150 }
    const rec = recommendFoods(nearlyDone, woman, 'any', per100)!
    for (const i of rec.items) expect(i.nutrition.calories).toBeLessThanOrEqual(150 + i.food.step * 3)
  })

  it('puts protein first when gaps are similar, and can skip unmeasured fiber', () => {
    const t = { calories: 2000, proteinG: 100, carbsG: 200, fatG: 70, fiberG: 30 }
    const ate = { calories: 1000, proteinG: 45, carbsG: 90, fatG: 30 } // no food listed fiber
    expect(rankGaps(ate, t)[0].focus).toBe('fiberG')
    expect(rankGaps(ate, t, ['fiberG'])[0].focus).toBe('proteinG')
    expect(rankGaps({ ...ate, fiberG: 12 }, t)[0].focus).toBe('proteinG')
  })

  it('suggests foods for a chosen focus', () => {
    const rec = recommendFoods(eaten, woman, 'any', per100, { focus: 'carbsG' })!
    expect(rec.focus).toBe('carbsG')
    for (const i of rec.items) expect(['carb', 'fruit']).toContain(i.food.role)
  })

  it('stays quiet when the day is done or there are no targets', () => {
    expect(recommendFoods({ ...eaten, calories: woman.calories }, woman, 'any', per100)).toBeNull()
    expect(recommendFoods(eaten, {}, 'any', per100)).toBeNull()
  })
})

describe('portionLabel', () => {
  it('uses natural units', () => {
    const eggs = CATALOG.find((f) => f.id === 'eggs')!
    const pb = CATALOG.find((f) => f.id === 'peanut-butter')!
    const chicken = CATALOG.find((f) => f.id === 'chicken-breast')!
    expect(portionLabel(eggs, 100)).toBe('2 eggs (100 g)')
    expect(portionLabel(eggs, 50)).toBe('1 egg (50 g)')
    expect(portionLabel(pb, 32)).toBe('2 tbsp (32 g)')
    expect(portionLabel(chicken, 150)).toBe('150 g')
  })
})
