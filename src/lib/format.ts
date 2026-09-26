import type { PersonalRecordRecord } from '../data/schema'
import { formatWeight } from '../domain/units'
import type { Units } from '../domain/types'

export function formatSetTarget(sets: number, repMin: number, repMax: number, timed?: boolean): string {
  const range = repMin === repMax ? `${repMin}` : `${repMin}–${repMax}`
  return `${sets} × ${range}${timed ? ' sec' : ''}`
}

export function describePR(pr: Pick<PersonalRecordRecord, 'kind' | 'value' | 'weightKg'>, units: Units, timed?: boolean): string {
  switch (pr.kind) {
    case 'heaviest':
      return `Heaviest: ${formatWeight(pr.value, units)}`
    case 'est1RM':
      return `Est. 1-rep max: ${formatWeight(pr.value, units)}`
    case 'repsAtWeight':
      if (timed) return `Longest hold: ${pr.value} sec`
      return pr.weightKg ? `Most reps at ${formatWeight(pr.weightKg, units)}: ${pr.value}` : `Most reps: ${pr.value}`
  }
}

export function formatDuration(totalSec: number): string {
  const m = Math.floor(totalSec / 60)
  const s = Math.max(0, Math.round(totalSec % 60))
  return `${m}:${String(s).padStart(2, '0')}`
}

export const DIFFICULTY_ANCHORS = [
  { from: 1, to: 3, label: 'Easy' },
  { from: 4, to: 6, label: 'Moderate' },
  { from: 7, to: 8, label: 'Hard' },
  { from: 9, to: 10, label: 'Max effort' },
]

export const difficultyLabel = (n: number) => DIFFICULTY_ANCHORS.find((a) => n >= a.from && n <= a.to)?.label ?? ''
