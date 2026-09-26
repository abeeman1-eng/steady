export type PRKind = 'heaviest' | 'repsAtWeight' | 'est1RM'

export interface SetPerformance {
  weightKg: number
  reps: number
}

export interface PRHit {
  kind: PRKind
  value: number
  /** For repsAtWeight: the weight the reps were done at. */
  weightKg?: number
}

const EPS = 1e-6
const MAX_REPS_FOR_1RM = 10

/** Epley estimate: weight × (1 + reps / 30), only for loaded sets of 10 reps or fewer. */
export function epley1RM(weightKg: number, reps: number): number | null {
  if (weightKg <= 0 || reps < 1 || reps > MAX_REPS_FOR_1RM) return null
  return weightKg * (1 + reps / 30)
}

/**
 * Personal records a completed set sets, compared with every earlier completed set of the same
 * exercise. The first time an exercise is logged sets a baseline, not a PR.
 */
export function detectPRs(candidate: SetPerformance, previous: SetPerformance[], opts: { timed?: boolean } = {}): PRHit[] {
  const done = previous.filter((s) => s.reps > 0)
  if (candidate.reps <= 0 || done.length === 0) return []

  const hits: PRHit[] = []
  const weight = Math.max(0, candidate.weightKg)

  const heaviest = Math.max(...done.map((s) => s.weightKg))
  if (!opts.timed && weight > 0 && weight > heaviest + EPS) {
    hits.push({ kind: 'heaviest', value: weight })
  }

  const atSameWeight = done.filter((s) => Math.abs(s.weightKg - weight) < EPS)
  if (atSameWeight.length > 0) {
    const bestReps = Math.max(...atSameWeight.map((s) => s.reps))
    if (candidate.reps > bestReps) hits.push({ kind: 'repsAtWeight', value: candidate.reps, weightKg: weight })
  }

  if (!opts.timed) {
    const est = epley1RM(weight, candidate.reps)
    const previousEsts = done.map((s) => epley1RM(s.weightKg, s.reps)).filter((e): e is number => e !== null)
    if (est !== null && previousEsts.length > 0 && est > Math.max(...previousEsts) + EPS) {
      hits.push({ kind: 'est1RM', value: est })
    }
  }

  return hits
}
