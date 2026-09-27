import type { NutrientKey, Nutrition } from './nutrition'
import type { MainGoal } from './types'

export type Sex = 'female' | 'male' | 'unspecified'
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'very' | 'extra'
/** A nutrition goal chosen in the plan builder; overrides what the training goals imply. */
export type NutritionGoal = 'lose' | 'maintain' | 'build'

export const NUTRITION_GOALS: { value: NutritionGoal; label: string; hint: string }[] = [
  { value: 'lose', label: 'Lose weight', hint: 'A gentle 15% calorie deficit' },
  { value: 'maintain', label: 'Maintain', hint: 'Keep your weight steady' },
  { value: 'build', label: 'Build muscle', hint: 'A small 5% surplus with extra protein' },
]

/** What the training goals imply, used when no nutrition goal has been chosen. */
export const nutritionGoalFromGoals = (goals: MainGoal[]): NutritionGoal => (goals.includes('weightLoss') ? 'lose' : goals.includes('strength') ? 'build' : 'maintain')

export const ACTIVITY_LEVELS: Record<ActivityLevel, { factor: number; label: string; hint: string }> = {
  sedentary: { factor: 1.2, label: 'Mostly sitting', hint: 'Desk job, little other exercise' },
  light: { factor: 1.375, label: 'Lightly active', hint: 'Light exercise 1–3 days a week' },
  moderate: { factor: 1.55, label: 'Moderately active', hint: 'Exercise 3–5 days a week' },
  very: { factor: 1.725, label: 'Very active', hint: 'Hard exercise 6–7 days a week' },
  extra: { factor: 1.9, label: 'Extremely active', hint: 'Physical job plus training' },
}

export interface TargetInputs {
  sex: Sex
  age: number
  heightCm: number
  weightKg: number
  activity: ActivityLevel
  goals: MainGoal[]
  nutritionGoal?: NutritionGoal
}

export type FullTargets = Required<Nutrition>

export interface SuggestedTargets {
  targets: FullTargets
  bmr: number
  maintenance: number
  /** e.g. -0.15 for a 15% deficit. */
  adjustment: number
  adjustmentReason: string
  /** True when the goal adjustment would have gone below the safe minimum. */
  raisedToMinimum: boolean
  /** One plain-language line per nutrient explaining where its number comes from. */
  why: Record<NutrientKey, string>
}

const MIN_CALORIES = 1200
/** Protein and fat scale with a reference weight capped at BMI 25, so they aren't overstated for heavier bodies. */
const REFERENCE_BMI = 25

const round10 = (n: number) => Math.round(n / 10) * 10

/** Mifflin-St Jeor resting energy. "Unspecified" uses the midpoint of the male and female constants. */
export function mifflinStJeor({ sex, age, heightCm, weightKg }: Pick<TargetInputs, 'sex' | 'age' | 'heightCm' | 'weightKg'>): number {
  const offset = sex === 'male' ? 5 : sex === 'female' ? -161 : -78
  return 10 * weightKg + 6.25 * heightCm - 5 * age + offset
}

function goalAdjustment(goal: NutritionGoal): { pct: number; reason: string } {
  if (goal === 'lose') return { pct: -0.15, reason: '15% below maintenance for steady, gradual weight loss' }
  if (goal === 'build') return { pct: 0.05, reason: '5% above maintenance to support building strength' }
  return { pct: 0, reason: 'maintenance, to keep your weight steady' }
}

/**
 * Suggested daily targets from standard formulas. These are starting points the user reviews
 * and edits; Steady never applies them on its own.
 */
export function suggestTargets(input: TargetInputs): SuggestedTargets {
  // Backstop: screens block minors before getting here, but never produce targets for one.
  if (!(input.age >= MIN_TARGET_AGE)) throw new MinorTargetsError()
  const bmr = mifflinStJeor(input)
  const maintenance = bmr * ACTIVITY_LEVELS[input.activity].factor
  const goal = input.nutritionGoal ?? nutritionGoalFromGoals(input.goals)
  const { pct, reason } = goalAdjustment(goal)
  const floor = Math.max(MIN_CALORIES, bmr)
  const adjusted = maintenance * (1 + pct)
  const raisedToMinimum = adjusted < floor
  const calories = round10(Math.max(adjusted, floor))

  const heightM = input.heightCm / 100
  const refKg = Math.min(input.weightKg, REFERENCE_BMI * heightM * heightM)
  const highProtein = goal !== 'maintain' || input.goals.includes('strength')
  const proteinPerKg = highProtein ? 1.6 : 1.2
  const proteinG = Math.round(refKg * proteinPerKg)
  const fatG = Math.max(Math.round((calories * 0.3) / 9), Math.round(refKg * 0.6))
  const carbsG = Math.max(0, Math.round((calories - proteinG * 4 - fatG * 9) / 4))

  const targets: FullTargets = {
    calories,
    proteinG,
    carbsG,
    fatG,
    fiberG: Math.round((calories / 1000) * 14),
    sugarG: Math.round((calories * 0.1) / 4),
    satFatG: Math.round((calories * 0.1) / 9),
    sodiumMg: 2300,
  }

  return {
    targets,
    bmr: Math.round(bmr),
    maintenance: round10(maintenance),
    adjustment: pct,
    adjustmentReason: reason,
    raisedToMinimum,
    why: {
      calories: raisedToMinimum ? `Raised to a safe minimum of ${round10(floor).toLocaleString()}` : `Maintenance ${round10(maintenance).toLocaleString()}, ${reason}`,
      proteinG: `${proteinPerKg} g per kg of body weight${highProtein ? ', higher to protect muscle' : ''}`,
      carbsG: 'The calories left after protein and fat',
      fatG: 'About 30% of calories',
      fiberG: '14 g per 1,000 calories',
      sugarG: 'Limit: 10% of calories. Counts all sugar, including fruit and milk',
      satFatG: 'Limit: 10% of calories',
      sodiumMg: 'Limit: 2,300 mg a day',
    },
  }
}

/**
 * Nutrition targets (calories and macros, suggested or typed in) are only for adults. Growing
 * bodies need enough energy, and formula-based targets, especially deficits, aren't safe for them.
 */
export const MIN_TARGET_AGE = 18

export class MinorTargetsError extends Error {
  constructor() {
    super(`Nutrition targets are only available for people ${MIN_TARGET_AGE} and older.`)
  }
}

export const isMinor = (age: number | undefined) => age !== undefined && age < MIN_TARGET_AGE

/**
 * Whether targets may be suggested, set or shown. Targets need a known adult age; the one
 * exception is showing targets that were saved before age was asked (never for a known minor).
 */
export function targetsPolicy(age: number | undefined): { canSet: boolean; canShowSaved: boolean } {
  return { canSet: age !== undefined && age >= MIN_TARGET_AGE, canShowSaved: !isMinor(age) }
}

export const ageFromBirthYear = (birthYear: number, now = new Date()) => now.getFullYear() - birthYear
export const birthYearFromAge = (age: number, now = new Date()) => now.getFullYear() - age

/**
 * True when the latest weight has moved enough since targets were set (2 kg or 3%) that the
 * suggestions are worth another look. Never changes anything by itself.
 */
export function targetsNeedReview(basisWeightKg: number | undefined, latestWeightKg: number | undefined): boolean {
  if (!basisWeightKg || !latestWeightKg) return false
  const diff = Math.abs(latestWeightKg - basisWeightKg)
  return diff >= 2 || diff / basisWeightKg >= 0.03
}
