/**
 * Optional health considerations the user can flag. Saved only on their device. They tailor
 * food suggestions, and some of them switch off formula-based targets entirely.
 */

export type Allergen = 'dairy' | 'gluten' | 'peanut' | 'treeNut' | 'egg' | 'fish' | 'shellfish' | 'soy' | 'sesame'
export type Condition = 'highBloodPressure' | 'highCholesterol' | 'diabetes' | 'kidneyDisease' | 'pregnancy' | 'eatingDisorder'
export type HealthFlag = Allergen | Condition

export const ALLERGENS: { value: Allergen; label: string }[] = [
  { value: 'dairy', label: 'Dairy or lactose' },
  { value: 'gluten', label: 'Gluten (celiac or sensitivity)' },
  { value: 'peanut', label: 'Peanuts' },
  { value: 'treeNut', label: 'Tree nuts' },
  { value: 'egg', label: 'Eggs' },
  { value: 'fish', label: 'Fish' },
  { value: 'shellfish', label: 'Shellfish' },
  { value: 'soy', label: 'Soy' },
  { value: 'sesame', label: 'Sesame' },
]

export const CONDITIONS: { value: Condition; label: string; hint: string }[] = [
  { value: 'highBloodPressure', label: 'High blood pressure', hint: 'Lower sodium limit, fewer salty suggestions' },
  { value: 'highCholesterol', label: 'High cholesterol', hint: 'Lower saturated-fat limit, fewer fatty-meat and cheese suggestions' },
  { value: 'diabetes', label: 'Diabetes or prediabetes', hint: 'Suggestions favor fiber over sugar' },
  { value: 'kidneyDisease', label: 'Kidney disease', hint: 'Steady won’t set targets; your care team should' },
  { value: 'pregnancy', label: 'Pregnant or breastfeeding', hint: 'Steady won’t set targets or suggest a deficit' },
  { value: 'eatingDisorder', label: 'History of disordered eating', hint: 'Steady won’t show calorie or macro targets' },
]

/** Conditions where formula targets could do harm, so Steady doesn't set any. */
export type BlockingCondition = 'kidneyDisease' | 'pregnancy' | 'eatingDisorder'
export const TARGET_BLOCKING_CONDITIONS: BlockingCondition[] = ['kidneyDisease', 'pregnancy', 'eatingDisorder']

const ALLERGEN_SET = new Set<string>(ALLERGENS.map((a) => a.value))
export const allergensIn = (flags: HealthFlag[] = []) => flags.filter((f): f is Allergen => ALLERGEN_SET.has(f))
export const conditionsIn = (flags: HealthFlag[] = []) => flags.filter((f): f is Condition => !ALLERGEN_SET.has(f))
export const blockingCondition = (flags: HealthFlag[] = []): BlockingCondition | undefined => TARGET_BLOCKING_CONDITIONS.find((c) => flags.includes(c))
