import { describe, expect, it } from 'vitest'
import { countMissingExtras, parseOffProduct, scaleNutrition, sumNutrition } from './nutrition'
import { ageFromBirthYear, birthYearFromAge, mifflinStJeor, suggestTargets, targetsNeedReview, type TargetInputs } from './targets'

const man: TargetInputs = { sex: 'male', age: 30, heightCm: 180, weightKg: 80, activity: 'moderate', goals: ['general'] }

describe('mifflinStJeor', () => {
  it('matches the published formula', () => {
    expect(mifflinStJeor(man)).toBe(1780) // 800 + 1125 − 150 + 5
    expect(mifflinStJeor({ ...man, sex: 'female' })).toBe(1614)
    expect(mifflinStJeor({ ...man, sex: 'unspecified' })).toBe(1697)
  })
})

describe('suggestTargets', () => {
  it('suggests maintenance for general fitness', () => {
    const s = suggestTargets(man)
    expect(s.maintenance).toBe(2760) // 1780 × 1.55 = 2759
    expect(s.targets).toEqual({ calories: 2760, proteinG: 96, carbsG: 387, fatG: 92, fiberG: 39, sugarG: 69, satFatG: 31, sodiumMg: 2300 })
  })

  it('macros add back up to the calorie target', () => {
    const { targets: t } = suggestTargets(man)
    expect(Math.abs(t.proteinG * 4 + t.carbsG * 4 + t.fatG * 9 - t.calories)).toBeLessThanOrEqual(6)
  })

  it('takes 15% off for weight loss and raises protein', () => {
    const s = suggestTargets({ ...man, goals: ['weightLoss', 'running'] })
    expect(s.adjustment).toBe(-0.15)
    expect(s.targets.calories).toBe(2350) // 2759 × 0.85 = 2345
    expect(s.targets.proteinG).toBe(128) // 1.6 g/kg
  })

  it('adds 5% for strength when not losing weight', () => {
    expect(suggestTargets({ ...man, goals: ['strength'] }).targets.calories).toBe(2900)
    expect(suggestTargets({ ...man, goals: ['strength', 'weightLoss'] }).adjustment).toBe(-0.15)
  })

  it('never goes below 1,200 calories or resting energy', () => {
    const small: TargetInputs = { sex: 'female', age: 70, heightCm: 150, weightKg: 45, activity: 'sedentary', goals: ['weightLoss'] }
    const s = suggestTargets(small)
    expect(s.raisedToMinimum).toBe(true)
    expect(s.targets.calories).toBe(1200)
    expect(s.why.calories).toMatch(/safe minimum/)
  })

  it('caps the protein reference weight at BMI 25', () => {
    const s = suggestTargets({ ...man, weightKg: 130, goals: ['strength'] })
    expect(s.targets.proteinG).toBe(130) // 25 × 1.8² = 81 kg × 1.6
  })

  it('moves with activity level', () => {
    expect(suggestTargets({ ...man, activity: 'sedentary' }).targets.calories).toBeLessThan(suggestTargets({ ...man, activity: 'very' }).targets.calories)
  })
})

describe('age and review helpers', () => {
  const now = new Date(2026, 8, 26)
  it('converts age to birth year and back', () => {
    expect(ageFromBirthYear(birthYearFromAge(31, now), now)).toBe(31)
  })

  it('flags targets for review after a meaningful weight change only', () => {
    expect(targetsNeedReview(80, 81)).toBe(false)
    expect(targetsNeedReview(80, 82)).toBe(true)
    expect(targetsNeedReview(50, 51.6)).toBe(true) // 3.2%
    expect(targetsNeedReview(undefined, 80)).toBe(false)
  })
})

describe('extra nutrients', () => {
  it('scales and sums extras, leaving unlisted ones out', () => {
    const a = { calories: 100, proteinG: 1, carbsG: 20, fatG: 0, fiberG: 3, sodiumMg: 10 }
    const b = { calories: 200, proteinG: 10, carbsG: 0, fatG: 15 }
    expect(scaleNutrition(a, 2)).toEqual({ calories: 200, proteinG: 2, carbsG: 40, fatG: 0, fiberG: 6, sodiumMg: 20 })
    const total = sumNutrition([a, b])
    expect(total).toMatchObject({ calories: 300, fiberG: 3, sodiumMg: 10 })
    expect(total.sugarG).toBeUndefined()
    expect(countMissingExtras([a, b])).toEqual({ fiberG: 1, sugarG: 2, satFatG: 2, sodiumMg: 1 })
  })

  it('reads extras from Open Food Facts, converting sodium from grams to mg', () => {
    const p = parseOffProduct({
      product_name: 'Bar',
      serving_size: '40 g',
      nutriments: { 'energy-kcal_serving': 180, proteins_serving: 8, carbohydrates_serving: 20, fat_serving: 7, fiber_serving: 4, sugars_serving: 9, 'saturated-fat_serving': 2.5, sodium_serving: 0.15 },
    })
    expect(p?.nutrition).toMatchObject({ fiberG: 4, sugarG: 9, satFatG: 2.5, sodiumMg: 150 })
  })
})
