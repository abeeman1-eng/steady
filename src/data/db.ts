import Dexie, { type EntityTable } from 'dexie'
import type {
  BodyMetricRecord,
  ExerciseRecord,
  FoodRecord,
  MealEntryRecord,
  PersonalRecordRecord,
  PlanRecord,
  PlannedSessionRecord,
  ProfileRecord,
  ProgressionSuggestionRecord,
  RunRecord,
  SetRecord,
  StravaAuthRecord,
  WorkoutRecord,
  SavedMealRecord,
  LookupCacheRecord,
} from './schema'

export type SteadyDB = Dexie & {
  profile: EntityTable<ProfileRecord, 'id'>
  exercises: EntityTable<ExerciseRecord, 'id'>
  plans: EntityTable<PlanRecord, 'id'>
  plannedSessions: EntityTable<PlannedSessionRecord, 'id'>
  workouts: EntityTable<WorkoutRecord, 'id'>
  sets: EntityTable<SetRecord, 'id'>
  runs: EntityTable<RunRecord, 'id'>
  progressionSuggestions: EntityTable<ProgressionSuggestionRecord, 'id'>
  personalRecords: EntityTable<PersonalRecordRecord, 'id'>
  foods: EntityTable<FoodRecord, 'id'>
  mealEntries: EntityTable<MealEntryRecord, 'id'>
  stravaAuth: EntityTable<StravaAuthRecord, 'id'>
  bodyMetrics: EntityTable<BodyMetricRecord, 'id'>
  savedMeals: EntityTable<SavedMealRecord, 'id'>
  lookupCache: EntityTable<LookupCacheRecord, 'id'>
}

export const TABLE_NAMES = [
  'profile',
  'exercises',
  'plans',
  'plannedSessions',
  'workouts',
  'sets',
  'runs',
  'progressionSuggestions',
  'personalRecords',
  'foods',
  'mealEntries',
  'stravaAuth',
  'bodyMetrics',
  'savedMeals',
] as const

/** Tables included in backups. lookupCache is a disposable cache and is left out. */
export type TableName = (typeof TABLE_NAMES)[number]

// All tables exist from version 1 so later phases do not need a migration just to start using them.
// Add a new this.version(n) block (never edit an old one) when the schema changes.
export const db = new Dexie('steady') as SteadyDB

db.version(1).stores({
  profile: 'id',
  exercises: 'id, name, pattern',
  plans: 'id, status',
  plannedSessions: 'id, planId, date, [planId+date], status',
  workouts: 'id, date, status, plannedSessionId',
  sets: 'id, workoutId, exerciseId',
  runs: 'id, workoutId, stravaActivityId',
  progressionSuggestions: 'id, exerciseId, status',
  personalRecords: 'id, exerciseId, date, setId, workoutId',
  foods: 'id, name, barcode, isFavorite',
  mealEntries: 'id, date, foodId',
  stravaAuth: 'id',
  bodyMetrics: 'id, date',
})

// v2: profile.mainGoal (one goal) became profile.goals (one or more). No index changes.
db.version(2)
  .stores({})
  .upgrade((tx) => tx.table('profile').toCollection().modify(migrateProfileToV2))

// v3: meal tracking. Foods get an externalId index; favorite meals and a lookup cache are added.
db.version(3).stores({
  foods: 'id, name, barcode, externalId',
  mealEntries: 'id, date, foodId, createdAt',
  savedMeals: 'id, name',
  lookupCache: 'id, fetchedAt',
})

/** Convert a v1 profile row in place. Safe to run on rows that are already v2. */
export function migrateProfileToV2(row: Record<string, unknown>): void {
  if (!Array.isArray(row.goals)) row.goals = typeof row.mainGoal === 'string' ? [row.mainGoal] : ['general']
  delete row.mainGoal
}
