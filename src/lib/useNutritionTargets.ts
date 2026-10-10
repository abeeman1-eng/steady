import { allergensIn, conditionsIn } from '../domain/health'
import type { FoodPrefs } from '../domain/mealPlanner'
import type { Nutrition } from '../domain/nutrition'
import { type BlockReason, ageFromBirth, targetsPolicy } from '../domain/targets'
import { useProfile } from './profileContext'

/**
 * The user's nutrition targets, but only when they're allowed: never for a known minor or with a
 * condition that switches targets off. Every screen that shows or uses targets should read them
 * through this, not from the profile directly. Also returns the food preferences (diet style,
 * allergens, conditions) that suggestions should respect.
 */
export function useNutritionTargets(): {
  targets: Partial<Nutrition> | undefined
  age: number | undefined
  canSet: boolean
  /** True when targets are switched off (age or a health condition). */
  blocked: boolean
  blockedBy: BlockReason | undefined
  foodPrefs: FoodPrefs
} {
  const profile = useProfile()
  const age = ageFromBirth(profile)
  const policy = targetsPolicy(age, profile.healthFlags)
  const saved = profile.nutritionTargets && Object.keys(profile.nutritionTargets).length ? profile.nutritionTargets : undefined
  return {
    targets: policy.canShowSaved ? saved : undefined,
    age,
    canSet: policy.canSet,
    blocked: !policy.canShowSaved,
    blockedBy: policy.blockedBy,
    foodPrefs: { diet: profile.dietStyle ?? 'any', avoid: allergensIn(profile.healthFlags), conditions: conditionsIn(profile.healthFlags) },
  }
}
