import type { MovementPattern, Units } from './types'
import { formatWeight } from './units'

/** One past session of an exercise, newest first in the history passed to suggestProgression. */
export interface SessionPerformance {
  /** The 1–10 rating from the finish screen, if the user gave one. */
  difficulty?: number
  repMin?: number
  repMax?: number
  sets: { weightKg: number; reps: number; completed: boolean }[]
}

export interface ExerciseInfo {
  pattern: MovementPattern
  isBodyweight: boolean
  timed?: boolean
}

export type Suggestion =
  | { kind: 'increaseWeight'; fromKg: number; toKg: number; reason: string }
  | { kind: 'increaseReps'; fromReps: number; toReps: number; reason: string }
  | { kind: 'reduceWeight'; fromKg: number; toKg: number; reason: string }
  /** Informational: progress was earned on reps but the rating says it was too hard to add more. */
  | { kind: 'hold'; reason: string }

const LB = 0.45359237
const LOWER_BODY: MovementPattern[] = ['squat', 'hinge', 'lunge']
/** Ratings of 9–10 mean "max effort": no increase, whatever the reps. */
export const MAX_RATING_FOR_INCREASE = 8

/** +5 lb upper / +10 lb lower body (+2.5 kg / +5 kg metric), per the spec. */
export function weightIncrement(pattern: MovementPattern, units: Units): number {
  const lower = LOWER_BODY.includes(pattern)
  return units === 'imperial' ? (lower ? 10 : 5) * LB : lower ? 5 : 2.5
}

/** 10% lighter, rounded down to a loadable step (2.5 lb or 1 kg). */
function reduced(kg: number, units: Units): number {
  const step = units === 'imperial' ? 2.5 * LB : 1
  return Math.max(step, Math.floor((kg * 0.9) / step) * step)
}

const topWeight = (s: SessionPerformance) => Math.max(0, ...s.sets.filter((x) => x.completed).map((x) => x.weightKg))
const rated = (s: SessionPerformance) => (s.difficulty ? ` and rated it ${s.difficulty}/10` : '')

/** Every planned set done, each at the top of the rep range. */
function hitTop(s: SessionPerformance): boolean {
  return s.repMax !== undefined && s.sets.length > 0 && s.sets.every((x) => x.completed && x.reps >= s.repMax!)
}

/** Any set below the bottom of the range, or any planned set not done. */
function missed(s: SessionPerformance): boolean {
  return s.repMin !== undefined && s.sets.some((x) => !x.completed || x.reps < s.repMin!)
}

/**
 * What to change for the next session of an exercise, using the last two sessions and the user's
 * 1–10 rating. Rules (from the spec):
 * - Hit the top of the rep range on every set and rated it 8 or lower: add weight (or +2 reps for
 *   bodyweight, +5 seconds for holds).
 * - Hit the top but rated it 9–10: hold, since it was close to max effort.
 * - Missed reps two sessions in a row: offer to drop the weight 10% (or keep it).
 * Returns null when nothing should change. The user always confirms; nothing applies by itself.
 */
export function suggestProgression(history: SessionPerformance[], ex: ExerciseInfo, units: Units): Suggestion | null {
  const [last, prev] = history
  if (!last || last.repMin === undefined || last.repMax === undefined) return null
  const weight = topWeight(last)
  const loaded = weight > 0

  if (hitTop(last)) {
    if (last.difficulty !== undefined && last.difficulty > MAX_RATING_FOR_INCREASE) {
      return { kind: 'hold', reason: `You hit ${last.repMax}${ex.timed ? ' seconds' : ' reps'} on every set but rated it ${last.difficulty}/10. Stay here until it feels more manageable.` }
    }
    if (loaded && !ex.timed) {
      const toKg = weight + weightIncrement(ex.pattern, units)
      return { kind: 'increaseWeight', fromKg: weight, toKg, reason: `You hit ${last.repMax} reps on every set${rated(last)}. Try ${formatWeight(toKg, units)}.` }
    }
    const step = ex.timed ? 5 : 2
    const fromReps = last.repMax
    return { kind: 'increaseReps', fromReps, toReps: fromReps + step, reason: `You hit ${fromReps}${ex.timed ? ' seconds' : ' reps'} on every set${rated(last)}. Try ${fromReps + step}.` }
  }

  if (prev && missed(last) && missed(prev) && loaded && !ex.timed && topWeight(prev) >= weight) {
    const toKg = reduced(weight, units)
    return { kind: 'reduceWeight', fromKg: weight, toKg, reason: `Reps came up short two sessions in a row. Drop to ${formatWeight(toKg, units)} for a while, or keep ${formatWeight(weight, units)}.` }
  }

  return null
}
