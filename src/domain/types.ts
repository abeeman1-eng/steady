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

export type SessionTargets =
  | { kind: 'strength'; exercises: ExerciseTarget[] }
  | { kind: 'cardio'; durationMin: number; activity: string; cue: string }

export interface SessionTemplate {
  /** 0 = Sunday … 6 = Saturday */
  weekday: number
  name: string
  type: 'strength' | 'cardio'
  optional: boolean
  targets: SessionTargets
}

export interface PlanInput {
  experienceLevel: ExperienceLevel
  /** One or more goals; at least one. */
  goals: MainGoal[]
  daysPerWeek: number
  equipment: Equipment[]
}

export interface GeneratedPlan {
  type: 'strength' | 'mixed'
  summary: string
  weekly: SessionTemplate[]
}
