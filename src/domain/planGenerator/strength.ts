import { EXERCISE_LIBRARY, expandEquipment, isAvailable } from '../exerciseLibrary'
import type { Equipment, ExerciseDef, ExerciseTarget, ExperienceLevel, MovementPattern } from '../types'

/** Movement slots for each session type, most important first; sessions take the first N. */
export const BLUEPRINTS = {
  fullA: ['squat', 'horizontalPush', 'horizontalPull', 'hinge', 'core', 'verticalPush'],
  fullB: ['hinge', 'verticalPush', 'verticalPull', 'lunge', 'core', 'horizontalPush'],
  fullC: ['lunge', 'horizontalPush', 'verticalPull', 'squat', 'core', 'biceps'],
  upper: ['horizontalPush', 'horizontalPull', 'verticalPush', 'verticalPull', 'triceps', 'biceps'],
  lower: ['squat', 'hinge', 'lunge', 'core', 'hinge', 'core'],
  coreArms: ['core', 'biceps', 'triceps', 'shoulders', 'core'],
} satisfies Record<string, MovementPattern[]>

const EQUIPMENT_PREFERENCE: Equipment[] = ['gym', 'dumbbells', 'bands', 'bodyweight']
const loadRank = (e: ExerciseDef) => Math.min(...e.equipment.map((x) => EQUIPMENT_PREFERENCE.indexOf(x)))

type SetScheme = { sets: number; repMin: number; repMax: number }

/** Everything that varies by experience level, in one place. */
export const LEVEL_CONFIG: Record<
  ExperienceLevel,
  {
    exercisesPerSession: number
    /** Skip the most technical lifts (difficulty 3) and start with the simplest variation. */
    beginnerFriendly: boolean
    /** Prefer harder variations first (e.g. barbell squat over leg press). */
    preferHarder: boolean
    compound: SetScheme
    isolation: SetScheme
    holdSec: [number, number]
    cardioMin: number
  }
> = {
  new: {
    exercisesPerSession: 5, beginnerFriendly: true, preferHarder: false,
    compound: { sets: 3, repMin: 8, repMax: 12 }, isolation: { sets: 3, repMin: 8, repMax: 12 },
    holdSec: [20, 40], cardioMin: 20,
  },
  // Knows the moves but is deconditioned: beginner exercise choices and volume.
  returning: {
    exercisesPerSession: 5, beginnerFriendly: true, preferHarder: false,
    compound: { sets: 3, repMin: 8, repMax: 12 }, isolation: { sets: 3, repMin: 8, repMax: 12 },
    holdSec: [20, 40], cardioMin: 20,
  },
  some: {
    exercisesPerSession: 5, beginnerFriendly: false, preferHarder: false,
    compound: { sets: 3, repMin: 8, repMax: 12 }, isolation: { sets: 3, repMin: 8, repMax: 12 },
    holdSec: [30, 45], cardioMin: 25,
  },
  experienced: {
    exercisesPerSession: 6, beginnerFriendly: false, preferHarder: true,
    compound: { sets: 4, repMin: 6, repMax: 10 }, isolation: { sets: 3, repMin: 10, repMax: 12 },
    holdSec: [30, 60], cardioMin: 30,
  },
  advanced: {
    exercisesPerSession: 6, beginnerFriendly: false, preferHarder: true,
    compound: { sets: 4, repMin: 5, repMax: 8 }, isolation: { sets: 3, repMin: 8, repMax: 12 },
    holdSec: [45, 60], cardioMin: 35,
  },
}

/**
 * Candidates for a movement slot, best first. Everyone prefers loadable equipment (it is easier
 * to progress); beginners skip the most technical lifts and get the simplest variation first.
 */
export function candidatesFor(pattern: MovementPattern, equipment: Equipment[], level: ExperienceLevel): ExerciseDef[] {
  const available = expandEquipment(equipment)
  const config = LEVEL_CONFIG[level]
  return EXERCISE_LIBRARY.filter((e) => e.pattern === pattern && isAvailable(e, available))
    .filter((e) => !config.beginnerFriendly || e.difficulty < 3)
    .sort((a, b) => {
      const byLoad = loadRank(a) - loadRank(b)
      if (byLoad !== 0) return byLoad
      return config.preferHarder ? b.difficulty - a.difficulty : a.difficulty - b.difficulty
    })
}

function targetFor(exercise: ExerciseDef, level: ExperienceLevel): Omit<ExerciseTarget, 'exerciseId'> {
  const config = LEVEL_CONFIG[level]
  if (exercise.timed) return { sets: 3, repMin: config.holdSec[0], repMax: config.holdSec[1] }
  return { ...(exercise.isCompound ? config.compound : config.isolation) }
}

/**
 * Fill a blueprint's slots. `variant` picks a later candidate (e.g. Upper B uses the second choice)
 * so repeated session types get some variety. Slots with no distinct candidate are skipped.
 */
export function buildStrengthSession(
  blueprint: readonly MovementPattern[],
  equipment: Equipment[],
  level: ExperienceLevel,
  variant = 0,
  maxExercises = LEVEL_CONFIG[level].exercisesPerSession,
): ExerciseTarget[] {
  const used = new Set<string>()
  const targets: ExerciseTarget[] = []
  for (const pattern of blueprint) {
    if (targets.length >= maxExercises) break
    const options = candidatesFor(pattern, equipment, level).filter((e) => !used.has(e.id))
    if (options.length === 0) continue
    const pick = options[Math.min(variant, options.length - 1)]
    used.add(pick.id)
    targets.push({ exerciseId: pick.id, ...targetFor(pick, level) })
  }
  return targets
}
