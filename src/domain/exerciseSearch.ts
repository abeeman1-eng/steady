import type { ExerciseDef, MuscleGroup } from './types'

export const MUSCLE_LABELS: Record<MuscleGroup, { name: string; where: string }> = {
  chest: { name: 'Chest', where: 'pecs' },
  back: { name: 'Back', where: 'lats and upper back' },
  shoulders: { name: 'Shoulders', where: 'delts' },
  biceps: { name: 'Biceps', where: 'front of upper arms' },
  triceps: { name: 'Triceps', where: 'back of upper arms' },
  quads: { name: 'Quads', where: 'front of thighs' },
  hamstrings: { name: 'Hamstrings', where: 'back of thighs' },
  glutes: { name: 'Glutes', where: 'butt and hips' },
  core: { name: 'Core', where: 'abs and obliques' },
}

/** Extra words that should find a muscle group. */
const MUSCLE_SYNONYMS: Record<MuscleGroup, string[]> = {
  chest: ['pecs', 'pec'],
  back: ['lats', 'lat', 'upper back'],
  shoulders: ['delts', 'delt', 'shoulder'],
  biceps: ['bicep', 'arms'],
  triceps: ['tricep', 'arms'],
  quads: ['quad', 'thighs', 'legs'],
  hamstrings: ['hamstring', 'hammies', 'legs'],
  glutes: ['glute', 'butt', 'booty', 'hips'],
  core: ['abs', 'ab', 'stomach', 'obliques'],
}

const words = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map(singular)

/** "pushups" → "pushup", "squats" → "squat"; leaves "press", "biceps" and "abs" alone. */
function singular(w: string): string {
  if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss') && !w.endsWith('ceps')) return w.slice(0, -1)
  return w
}

/** Spacing- and plural-insensitive form: "Push ups" and "push-up" both become "pushup". */
const compact = (s: string) => singular(words(s).join(''))

/**
 * Rank exercises for a typed query. Matches the name, common aliases (e.g. "RDL", "bench"),
 * and muscle names ("glutes", "abs"), ignoring spacing, hyphens and plurals.
 */
export function searchExercises(query: string, library: readonly ExerciseDef[]): ExerciseDef[] {
  const q = compact(query)
  const qWords = words(query)
  if (!q) return []

  const scored = library.map((e) => {
    const names = [e.name, ...e.aliases]
    let score = 0
    for (const n of names) {
      const c = compact(n)
      if (c === q) score = Math.max(score, n === e.name ? 100 : 90)
      else if (c.startsWith(q)) score = Math.max(score, 70)
      // Mid-word matches need 4+ letters, or "rdl" would match "backwa(rdl)unge".
      else if (q.length >= 4 && c.includes(q)) score = Math.max(score, 60)
      else {
        const nWords = words(n)
        if (qWords.every((w) => nWords.some((nw) => nw.startsWith(w)))) score = Math.max(score, 50)
      }
    }
    if (score === 0) {
      // Primary muscle (listed first) ranks above secondary ones.
      const hitIndex = e.muscleGroups.findIndex((m) => [m, ...MUSCLE_SYNONYMS[m]].map(compact).includes(q))
      if (hitIndex >= 0) score = hitIndex === 0 ? 30 : 20
    }
    return { e, score }
  })

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || a.e.difficulty - b.e.difficulty || a.e.name.localeCompare(b.e.name))
    .map((s) => s.e)
}
