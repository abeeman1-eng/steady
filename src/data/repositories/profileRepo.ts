import { todayISO } from '../../domain/dates'
import type { Build, Equipment, ExperienceLevel, GeneratedPlan, MainGoal, Units } from '../../domain/types'
import { db } from '../db'
import { stamp, touch } from '../records'
import type { ProfileRecord, RunningGoal } from '../schema'
import { addBodyWeight } from './bodyRepo'
import { activatePlan } from './planRepo'

/** Single local profile until accounts exist. */
export const PROFILE_ID = 'me'

export const DEFAULT_REST_SEC = 90

export async function getProfile(): Promise<ProfileRecord | null> {
  return (await db.profile.get(PROFILE_ID)) ?? null
}

export async function updateProfile(changes: Partial<Omit<ProfileRecord, 'id' | 'createdAt' | 'userId'>>): Promise<void> {
  await db.profile.update(PROFILE_ID, touch(changes))
}

export interface OnboardingAnswers {
  experienceLevel: ExperienceLevel
  goals: MainGoal[]
  daysPerWeek: number
  equipment: Equipment[]
  units: Units
  heightCm?: number
  weightKg?: number
  build?: Build
  runningGoal?: RunningGoal
}

/**
 * Save onboarding answers and make the reviewed plan active. Used for first-time onboarding and
 * when answers are changed later from settings.
 */
export async function saveOnboarding(answers: OnboardingAnswers, plan: GeneratedPlan): Promise<void> {
  const { weightKg, ...profileFields } = answers
  const existing = await getProfile()
  if (existing) {
    await updateProfile(profileFields)
  } else {
    await db.profile.add(
      stamp(
        {
          ...profileFields,
          restTimerSec: DEFAULT_REST_SEC,
          restTimerAlerts: true,
          onboardedAt: new Date().toISOString(),
        },
        PROFILE_ID,
      ),
    )
  }
  if (weightKg) await addBodyWeight(todayISO(), weightKg)
  await activatePlan(plan)
}
