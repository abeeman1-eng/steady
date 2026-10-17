export type ExperienceLevel = 'new' | 'returning' | 'some' | 'experienced' | 'advanced'
export type MainGoal = 'strength' | 'running' | 'weightLoss' | 'general'
export type Equipment = 'gym' | 'dumbbells' | 'bands' | 'bodyweight'
export type Units = 'imperial' | 'metric'
export type Build = 'slim' | 'average' | 'athletic' | 'heavier'

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'core'

export type MovementPattern =
  | 'squat'
  | 'hinge'
  | 'lunge'
  | 'horizontalPush'
  | 'verticalPush'
  | 'horizontalPull'
  | 'verticalPull'
  | 'biceps'
  | 'triceps'
  | 'shoulders'
  | 'core'

export interface ExerciseDef {
  id: string
  name: string
  description: string
  formCues: string[]
  muscleGroups: MuscleGroup[]
  /** Any one of these is enough to do the exercise. */
  equipment: Equipment[]
  isBodyweight: boolean
  substituteIds: string[]
  pattern: MovementPattern
  isCompound: boolean
  /** 1 = easiest. Used to pick beginner-friendly variations. */
  difficulty: 1 | 2 | 3
  /** Timed holds (e.g. plank) log seconds in the reps field. */
  timed?: boolean
  /** Step-by-step instructions for the exercise guide. */
  steps: string[]
  /** Other names people search for, e.g. "RDL". */
  aliases: string[]
}

export interface ExerciseTarget {
  exerciseId: string
  sets: number
  repMin: number
  repMax: number
}

/** Running plan session types. Run/walk is the easy run for new runners; intervals are experienced-only. */
export type RunType = 'easy' | 'long' | 'intervals' | 'runWalk' | 'race'

export interface RunTarget {
  kind: 'run'
  runType: RunType
  /** Target distance in meters (continuous runs and the race). */
  distanceM?: number
  /** Target time (run/walk sessions, which are timed rather than measured). */
  durationMin?: number
  /** What to do, e.g. "Alternate 1 minute running with 2 minutes walking". */
  detail: string
  /** Plain-language effort, e.g. "Easy: you can hold a conversation". */
  cue: string
}

export type SessionTargets =
  | { kind: 'strength'; exercises: ExerciseTarget[] }
  | { kind: 'cardio'; durationMin: number; activity: string; cue: string }
  | RunTarget

export interface SessionTemplate {
  /** 0 = Sunday … 6 = Saturday */
  weekday: number
  name: string
  type: 'strength' | 'cardio' | 'running'
  optional: boolean
  targets: SessionTargets
}

/** One session on a specific date (running plans change week to week, so they're dated). */
export type DatedSessionTemplate = Omit<SessionTemplate, 'weekday'> & { date: string }

export type RunPhase = 'base' | 'build' | 'recovery' | 'peak' | 'taper' | 'race'

/** A week of a running plan, for the plan overview. Distances in meters. */
export interface RunWeek {
  start: string
  end: string
  phase: RunPhase
  distanceM: number
  longRunM: number
}

export interface RunningGoalInput {
  label: string
  distanceM: number
  /** Race or target day, "YYYY-MM-DD". */
  date: string
}

export interface PlanInput {
  experienceLevel: ExperienceLevel
  /** One or more goals; at least one. */
  goals: MainGoal[]
  daysPerWeek: number
  equipment: Equipment[]
  /** With the running goal, a dated running plan is built toward this. */
  runningGoal?: RunningGoalInput
  /** First day of the plan (default today). */
  startDate?: string
}

export interface GeneratedPlan {
  type: 'strength' | 'mixed' | 'running'
  summary: string
  /** Repeating week (strength and mixed plans). Empty for running plans. */
  weekly: SessionTemplate[]
  /** Running plans: every session by date, through race day. */
  sessions?: DatedSessionTemplate[]
  runWeeks?: RunWeek[]
  goalDistance?: number
  goalDate?: string
  /** The goal date was sooner than recommended and the user continued anyway. */
  flaggedUnrealistic?: boolean
}
