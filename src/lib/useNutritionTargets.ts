import type { Nutrition } from '../domain/nutrition'
import { ageFromBirthYear, targetsPolicy } from '../domain/targets'
import { useProfile } from './profileContext'

/**
 * The user's nutrition targets, but only when they're allowed: never for a known minor. Every
 * screen that shows or uses targets should read them through this, not from the profile directly.
 */
export function useNutritionTargets(): { targets: Partial<Nutrition> | undefined; age: number | undefined; canSet: boolean; minor: boolean } {
  const profile = useProfile()
  const age = profile.birthYear ? ageFromBirthYear(profile.birthYear) : undefined
  const policy = targetsPolicy(age)
  const saved = profile.nutritionTargets && Object.keys(profile.nutritionTargets).length ? profile.nutritionTargets : undefined
  return { targets: policy.canShowSaved ? saved : undefined, age, canSet: policy.canSet, minor: !policy.canShowSaved }
}
