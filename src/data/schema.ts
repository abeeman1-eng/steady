import type { MealType, Nutrition } from '../domain/nutrition'
import type { PRKind } from '../domain/records'
import type { DietStyle } from '../domain/foodCatalog'
import type { ActivityLevel, NutritionGoal, Sex } from '../domain/targets'
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
  /** Meal tracking on Today and in the app. Undefined means on. */
  showMeals?: boolean
  /** Optional daily targets the user sets; the app never sets them. */
  nutritionTargets?: Partial<Nutrition>
  /** Weight the targets were last set from, to suggest a review when it changes. */
  nutritionTargetsBasis?: { weightKg: number; setAt: string }
  /** Only used to suggest nutrition targets. */
  sex?: Sex
  /** Stored instead of age so it stays current. */
  birthYear?: number
  activityLevel?: ActivityLevel
  nutritionGoal?: NutritionGoal
  dietStyle?: DietStyle
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

/** A food at one serving size; nutrition values are per serving. */
export interface FoodRecord extends BaseRecord, Nutrition {
  name: string
  servingSize: string
  source: 'manual' | 'usda' | 'openFoodFacts'
  /** Normalized (see normalizeBarcode). */
  barcode?: string
  /** Dedupes foods from a database, e.g. "usda:173944:118" (fdcId and serving grams). */
  externalId?: string
  isFavorite: boolean
}

/**
 * One logged food. Name, serving and per-serving nutrition are copied from the food when
 * logged, so editing or deleting a food never rewrites past days.
 */
export interface MealEntryRecord extends BaseRecord, Nutrition {
  date: string
  mealType: MealType
  foodId: string
  servings: number
  name: string
  servingSize: string
}

/** A favorite whole meal: foods and servings that can be logged again in one tap. */
export interface SavedMealRecord extends BaseRecord {
  name: string
  items: { foodId: string; servings: number }[]
}

/** Cached Open Food Facts responses (not backed up). */
export interface LookupCacheRecord {
  id: string
  value: unknown
  fetchedAt: string
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
