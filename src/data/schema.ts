import type { PRKind } from '../domain/records'
import type { Build, Equipment, ExerciseDef, ExperienceLevel, MainGoal, SessionTargets, SessionTemplate, Units } from '../domain/types'

/**
 * Every record carries sync-ready fields so a server can take over when accounts arrive.
 * Weights are stored in kilograms and distances in meters; the UI converts for display.
 */
export interface BaseRecord {
  id: string
  createdAt: string
  updatedAt: string
  userId: string
}

export interface RunningGoal {
  label: '5K' | '10K' | 'Half marathon' | 'Marathon' | 'Custom'
  distanceM: number
  date: string
}

export interface ProfileRecord extends BaseRecord {
  experienceLevel: ExperienceLevel
  /** One or more goals (schema v2; v1 stored a single mainGoal). */
  goals: MainGoal[]
  daysPerWeek: number
  equipment: Equipment[]
  units: Units
  heightCm?: number
  build?: Build
  runningGoal?: RunningGoal
  restTimerSec: number
  restTimerAlerts: boolean
  onboardedAt: string
  lastBackupAt?: string
  backupReminderSnoozedUntil?: string
  persistentStorage?: boolean
}

export type ExerciseRecord = ExerciseDef & BaseRecord

export interface PlanRecord extends BaseRecord {
  type: 'strength' | 'mixed' | 'running'
  status: 'active' | 'archived'
  startDate: string
  summary: string
  weekly: SessionTemplate[]
  /** Planned sessions exist up to and including this date. */
  generatedThrough?: string
  goalDistance?: number
  goalDate?: string
  flaggedUnrealistic?: boolean
}

export interface PlannedSessionRecord extends BaseRecord {
  planId: string
  date: string
  name: string
  type: 'strength' | 'cardio' | 'running'
  optional: boolean
  targets: SessionTargets
  status: 'planned' | 'done' | 'missed'
}

export interface WorkoutRecord extends BaseRecord {
  plannedSessionId?: string
  date: string
  name: string
  type: 'strength' | 'cardio' | 'running'
  status: 'inProgress' | 'completed'
  startedAt: string
  finishedAt?: string
  difficulty?: number
  notes?: string
  source: 'manual' | 'strava'
  /** Cardio sessions: time spent. */
  durationSec?: number
  cardioTarget?: { durationMin: number; activity: string; cue: string }
}

export interface SetRecord extends BaseRecord {
  workoutId: string
  exerciseId: string
  /** Position of the exercise within the workout. */
  order: number
  setNumber: number
  /** null until the user enters a weight for a loaded exercise. */
  weightKg: number | null
  reps: number
  repMin?: number
  repMax?: number
  completed: boolean
  isPR: boolean
}

export interface RunRecord extends BaseRecord {
  workoutId: string
  distanceM: number
  durationSec: number
  stravaActivityId?: number
}

export interface ProgressionSuggestionRecord extends BaseRecord {
  exerciseId: string
  suggestedWeightKg?: number
  suggestedReps?: number
  reason: string
  status: 'pending' | 'accepted' | 'dismissed'
}

export interface PersonalRecordRecord extends BaseRecord {
  exerciseId: string
  kind: PRKind
  value: number
  weightKg?: number
  setId: string
  workoutId: string
  date: string
}

export interface FoodRecord extends BaseRecord {
  name: string
  servingSize: string
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  source: 'manual' | 'usda' | 'openFoodFacts'
  barcode?: string
  isFavorite: boolean
}

export interface MealEntryRecord extends BaseRecord {
  date: string
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks'
  foodId: string
  servings: number
}

export interface StravaAuthRecord extends BaseRecord {
  accessToken: string
  refreshToken: string
  expiresAt: number
  athleteId: number
}

export interface BodyMetricRecord extends BaseRecord {
  date: string
  weightKg: number
}
