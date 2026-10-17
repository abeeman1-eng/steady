import { addDays, daysBetween, weekdayOf } from './dates'
import type { DatedSessionTemplate, ExperienceLevel, RunPhase, RunTarget, RunType, RunWeek, RunningGoalInput } from './types'

/**
 * Running plans, worked backward from the goal date:
 * - Peak week about 3 weeks out, then a 3-week taper of shorter runs into race day.
 * - No week is more than 10% longer than the biggest week so far, and an easier recovery week
 *   (20% shorter) follows every 3 weeks of building. When the date is sooner than recommended,
 *   the plan still never builds faster than that; it peaks lower instead (the "compressed" case).
 * - New runners start with run/walk intervals before continuous running.
 * - Session types: easy, long, intervals (experienced runners only), rest. Hard sessions
 *   (intervals, long run) never fall on back-to-back days.
 */

export type RaceKind = '5K' | '10K' | 'Half marathon' | 'Marathon'

export const RACE_DISTANCE_M: Record<RaceKind, number> = { '5K': 5000, '10K': 10000, 'Half marathon': 21097.5, Marathon: 42195 }

/** Recommended minimum weeks of preparation (from the spec). */
export const MIN_WEEKS: Record<RaceKind, { newRunner: number; experienced: number }> = {
  '5K': { newRunner: 8, experienced: 4 },
  '10K': { newRunner: 10, experienced: 6 },
  'Half marathon': { newRunner: 14, experienced: 10 },
  Marathon: { newRunner: 20, experienced: 16 },
}

/** Custom distances plan like the next race up, so a 7 km goal gets 10K-style preparation. */
export function raceKindFor(distanceM: number): RaceKind {
  if (distanceM <= 5000 + 1) return '5K'
  if (distanceM <= 10000 + 1) return '10K'
  if (distanceM <= 21097.5 + 1) return 'Half marathon'
  return 'Marathon'
}

/**
 * Experience levels describe exercise in general. "Getting back into it" counts as a new runner
 * here: the safer assumption after a long break.
 */
export const isNewRunner = (level: ExperienceLevel) => level === 'new' || level === 'returning'

export const weeksUntil = (from: string, to: string) => Math.floor(daysBetween(from, to) / 7)

export interface GoalCheck {
  kind: RaceKind
  minWeeks: number
  weeksAvailable: number
  realistic: boolean
  /** The earliest date that meets the minimum, offered as "Move my date". */
  suggestedDate: string
  /** Why the date is too soon, in plain language. Empty when realistic. */
  reason: string
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

/** The unrealistic-goal check: is there at least the recommended number of weeks? */
export function checkRunningGoal(goal: Pick<RunningGoalInput, 'distanceM' | 'date' | 'label'>, level: ExperienceLevel, today: string): GoalCheck {
  const kind = raceKindFor(goal.distanceM)
  const newRunner = isNewRunner(level)
  const minWeeks = MIN_WEEKS[kind][newRunner ? 'newRunner' : 'experienced']
  const weeksAvailable = Math.max(0, weeksUntil(today, goal.date))
  const realistic = weeksAvailable >= minWeeks
  const what = goal.label === 'Custom' || !goal.label ? `a run of this distance (planned like a ${kind})` : `a ${goal.label}`
  const who = newRunner ? 'New runners' : 'Runners with some experience'
  return {
    kind,
    minWeeks,
    weeksAvailable,
    realistic,
    suggestedDate: addDays(today, minWeeks * 7),
    reason: realistic
      ? ''
      : `${who} usually need at least ${plural(minWeeks, 'week')} to get ready for ${what}. Your date is ${weeksAvailable === 0 ? 'less than a week' : plural(weeksAvailable, 'week')} away. Getting ready sooner would mean adding distance faster than about 10% a week, which raises the risk of injury.`,
  }
}

// ----- Plan building -----

/** Peak weekly distance in km: [new runner, some experience]. Very experienced runners get 15% more. */
const PEAK_WEEK_KM: Record<RaceKind, [number, number]> = { '5K': [15, 25], '10K': [22, 35], 'Half marathon': [32, 45], Marathon: [45, 60] }
const PEAK_LONG_RUN_KM: Record<RaceKind, [number, number]> = { '5K': [5, 7], '10K': [9, 12], 'Half marathon': [16, 19], Marathon: [29, 32] }
/** Starting weekly distance. For new runners this is distance covered while run/walking (3 × ~20 min). */
const START_WEEK_KM: Record<ExperienceLevel, number> = { new: 7, returning: 9, some: 14, experienced: 20, advanced: 28 }
const ADVANCED_BOOST = 1.15
/** Longest sensible everyday easy run, which limits the peak when there are few run days. */
const MAX_EASY_KM = { newRunner: 6, experienced: 12 }

export const MAX_WEEKLY_INCREASE = 0.1
const RECOVERY_FACTOR = 0.8
/** Build weeks between recovery weeks. */
const BUILD_BLOCK = 3
/** Weeks from the peak to race day, with the share of peak distance in each (race week last). */
const TAPER = [0.8, 0.65, 0.45]
/** Run/walk sessions are timed; this converts their target distance to minutes. */
const RUN_WALK_MIN_PER_KM = 9

/** Weekdays for runs (0 = Sunday). The long run is last (Saturday); intervals take `INTERVAL_SLOT`. */
export const RUN_SLOTS: Record<number, number[]> = {
  2: [2, 6],
  3: [2, 4, 6],
  4: [1, 2, 4, 6],
  5: [1, 2, 3, 5, 6],
  6: [1, 2, 3, 4, 5, 6],
}
const INTERVAL_SLOT = 0
export const clampRunDays = (n: number) => Math.min(6, Math.max(2, Math.round(n)))

const CUES = {
  easy: 'Easy: you can hold a conversation',
  long: 'Easy and steady: slower than you think',
  intervals: 'Hard but controlled during the fast parts, easy jogging between',
  race: 'Start easier than you feel like, then settle in',
}

const SHORT_INTERVALS = [
  'Warm up 10 min easy. Then 6 × 400 m fast with 90 seconds of easy jogging between. Cool down 10 min.',
  'Warm up 10 min easy. Then 5 × 800 m fast with 2 minutes of easy jogging between. Cool down 10 min.',
  'Warm up 10 min easy. Then 4 × 1 km at about 10K race effort with 2 minutes easy between. Cool down 10 min.',
]
const LONG_INTERVALS = [
  'Warm up 10 min easy. Then 3 × 1.5 km at about half-marathon effort with 2 minutes easy between. Cool down 10 min.',
  'Warm up 10 min easy. Then 20 minutes steady at a “comfortably hard” effort. Cool down 10 min.',
  'Warm up 10 min easy. Then 5 × 1 km at about 10K race effort with 90 seconds easy between. Cool down 10 min.',
]

/** Run/walk ratio by week for new and returning runners; null once running is continuous. */
export function runWalkFor(level: ExperienceLevel, weekIndex: number): string | null {
  const stages =
    level === 'new'
      ? ['1 minute running, 2 minutes walking', '1 minute running, 2 minutes walking', '2 minutes running, 1 minute walking', '2 minutes running, 1 minute walking', '4 minutes running, 1 minute walking', '4 minutes running, 1 minute walking']
      : level === 'returning'
        ? ['3 minutes running, 1 minute walking', '3 minutes running, 1 minute walking']
        : []
  return stages[weekIndex] ?? null
}

const roundHalfKm = (km: number) => Math.max(0.5, Math.round(km * 2) / 2)
const round5 = (n: number) => Math.max(5, Math.round(n / 5) * 5)

export interface RunScheduleInput {
  goal: RunningGoalInput
  level: ExperienceLevel
  runDays: number
  startDate: string
}

export interface RunSchedule {
  sessions: DatedSessionTemplate[]
  weeks: RunWeek[]
  /** True when the usual peak couldn't be reached in time at a safe build rate. */
  compressed: boolean
  peakWeekKm: number
}

/** Weekly distances (km) and phases, oldest week first; the last week contains race day. */
export function weeklyVolumes(kind: RaceKind, level: ExperienceLevel, runDays: number, weekCount: number): { km: number; phase: RunPhase }[] {
  const col = isNewRunner(level) ? 0 : 1
  const boost = level === 'advanced' ? ADVANCED_BOOST : 1
  const longPeak = PEAK_LONG_RUN_KM[kind][col] * boost
  const maxEasy = MAX_EASY_KM[isNewRunner(level) ? 'newRunner' : 'experienced']
  const peak = Math.min(PEAK_WEEK_KM[kind][col] * boost, longPeak + (clampRunDays(runDays) - 1) * maxEasy)
  const start = Math.min(START_WEEK_KM[level], peak * 0.8)
  const peakIdx = Math.max(0, weekCount - 1 - TAPER.length)

  // Weeks of building needed to go from start to peak, counting recovery weeks.
  let steps = 0
  for (let v = start; v < peak - 1e-9; v *= 1 + MAX_WEEKLY_INCREASE) steps++
  const needed = steps + Math.max(0, Math.floor((steps - 1) / BUILD_BLOCK))
  const baseWeeks = Math.max(0, peakIdx - needed)

  const out: { km: number; phase: RunPhase }[] = []
  let last = start
  let sinceRecovery = 0
  for (let k = 0; k <= peakIdx; k++) {
    if (k <= baseWeeks) {
      out.push({ km: start, phase: k === peakIdx && peakIdx > 0 ? 'peak' : 'base' })
      continue
    }
    if (sinceRecovery === BUILD_BLOCK && k !== peakIdx) {
      out.push({ km: last * RECOVERY_FACTOR, phase: 'recovery' })
      sinceRecovery = 0
      continue
    }
    last = Math.min(peak, last * (1 + MAX_WEEKLY_INCREASE))
    sinceRecovery++
    out.push({ km: last, phase: k === peakIdx ? 'peak' : 'build' })
  }
  const peakKm = out[peakIdx].km
  for (let k = peakIdx + 1; k < weekCount; k++) {
    const weeksToRace = weekCount - 1 - k
    out.push({ km: peakKm * TAPER[TAPER.length - 1 - weeksToRace], phase: weeksToRace === 0 ? 'race' : 'taper' })
  }
  return out
}

/**
 * The peak weekly distance (km) a plan of the recommended minimum length reaches. A plan that
 * peaks below this was compressed to fit a date sooner than recommended.
 */
export function usualPeakKm(kind: RaceKind, level: ExperienceLevel, runDays: number): number {
  const minWeeks = MIN_WEEKS[kind][isNewRunner(level) ? 'newRunner' : 'experienced']
  return Math.max(...weeklyVolumes(kind, level, runDays, minWeeks + 1).map((w) => w.km))
}

export function buildRunSchedule({ goal, level, runDays: requestedDays, startDate }: RunScheduleInput): RunSchedule {
  const kind = raceKindFor(goal.distanceM)
  const runDays = clampRunDays(requestedDays)
  const raceDate = goal.date
  const weekCount = Math.max(1, Math.ceil((daysBetween(startDate, raceDate) + 1) / 7))
  const volumes = weeklyVolumes(kind, level, runDays, weekCount)
  const col = isNewRunner(level) ? 0 : 1
  const boost = level === 'advanced' ? ADVANCED_BOOST : 1
  const longPeak = PEAK_LONG_RUN_KM[kind][col] * boost
  const peakKm = Math.max(...volumes.map((v) => v.km))
  const usual = usualPeakKm(kind, level, runDays)
  const canDoIntervals = (level === 'experienced' || level === 'advanced') && runDays >= 3
  const minEasy = isNewRunner(level) ? 2 : 3
  const intervalPool = kind === '5K' || kind === '10K' ? SHORT_INTERVALS : LONG_INTERVALS

  const sessions: DatedSessionTemplate[] = []
  const weeks: RunWeek[] = []
  let intervalCount = 0

  for (let k = 0; k < weekCount; k++) {
    const end = addDays(raceDate, -7 * (weekCount - 1 - k))
    const start = addDays(end, -6)
    const { km, phase } = volumes[k]
    const isRaceWeek = k === weekCount - 1
    const runWalk = runWalkFor(level, k)
    const slots = RUN_SLOTS[runDays]

    // Long run grows in step with weekly distance, up to the goal's usual longest run.
    const longKm = isRaceWeek ? 0 : roundHalfKm(Math.min(longPeak * (km / Math.max(usual, peakKm)), km * (runDays === 2 ? 0.55 : 0.5)))
    const intervals = canDoIntervals && !isRaceWeek && phase !== 'base' && k > 0
    const intervalKm = intervals ? roundHalfKm(Math.max(5, km * 0.2)) : 0
    const easySlots = slots.length - (isRaceWeek ? 0 : 1) - (intervals ? 1 : 0)
    const easyKm = roundHalfKm(Math.max(minEasy, (km - longKm - intervalKm) / Math.max(1, easySlots)))

    let weekDistanceM = 0
    for (let d = 0; d < 7; d++) {
      const date = addDays(start, d)
      if (date < startDate) continue
      // Race week: rest the day before; race day gets the race.
      if (isRaceWeek && date >= addDays(raceDate, -1)) continue
      const slot = slots.indexOf(weekdayOf(date))
      if (slot < 0) continue
      const isLong = !isRaceWeek && slot === slots.length - 1
      const isIntervals = intervals && slot === INTERVAL_SLOT
      const target: RunTarget = isLong
        ? runTarget('long', longKm, runWalk, CUES.long)
        : isIntervals
          ? { kind: 'run', runType: 'intervals', distanceM: intervalKm * 1000, detail: intervalPool[intervalCount++ % intervalPool.length], cue: CUES.intervals }
          : runTarget(runWalk ? 'runWalk' : 'easy', easyKm, runWalk, CUES.easy)
      weekDistanceM += (isLong ? longKm : isIntervals ? intervalKm : easyKm) * 1000
      sessions.push({ date, name: sessionName(target.runType, !!runWalk), type: 'running', optional: false, targets: target })
    }
    if (isRaceWeek && raceDate >= startDate) {
      const race: RunTarget = {
        kind: 'run',
        runType: 'race',
        distanceM: goal.distanceM,
        detail: runWalk ? 'Run/walk is completely fine. Finishing is the goal.' : 'Start slower than you think for the first kilometer, then settle into your pace. Enjoy it.',
        cue: CUES.race,
      }
      sessions.push({ date: raceDate, name: `Race day: ${goal.label === 'Custom' ? 'goal run' : goal.label}`, type: 'running', optional: false, targets: race })
      weekDistanceM += goal.distanceM
    }
    weeks.push({ start, end, phase, distanceM: Math.round(weekDistanceM), longRunM: longKm * 1000 })
  }

  return { sessions, weeks, compressed: peakKm < usual * 0.97, peakWeekKm: peakKm }
}

function runTarget(runType: RunType, km: number, runWalk: string | null, cue: string): RunTarget {
  if (runWalk) {
    return { kind: 'run', runType, durationMin: round5(Math.max(15, km * RUN_WALK_MIN_PER_KM)), detail: `Alternate ${runWalk}`, cue }
  }
  return { kind: 'run', runType, distanceM: km * 1000, detail: runType === 'long' ? 'Your longest run of the week' : 'Relaxed, steady running', cue }
}

function sessionName(type: RunType, runWalk: boolean): string {
  if (type === 'long') return runWalk ? 'Long run/walk' : 'Long run'
  if (type === 'intervals') return 'Intervals'
  if (type === 'runWalk') return 'Run/walk'
  return 'Easy run'
}
