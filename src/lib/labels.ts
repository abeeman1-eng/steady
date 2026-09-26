import type { Equipment, ExperienceLevel, MainGoal } from '../domain/types'

export const EXPERIENCE_OPTIONS: { value: ExperienceLevel; label: string; hint: string }[] = [
  { value: 'new', label: 'New to exercise', hint: 'We’ll keep things simple and explain each move' },
  { value: 'returning', label: 'Getting back into it', hint: 'You’ve trained before, but it’s been a while' },
  { value: 'some', label: 'Some experience', hint: 'Less than a year of regular training' },
  { value: 'experienced', label: 'Experienced', hint: '1 to 3 years of regular training' },
  { value: 'advanced', label: 'Very experienced', hint: '3+ years, comfortable with barbell lifts' },
]

export const GOAL_OPTIONS: { value: MainGoal; label: string }[] = [
  { value: 'strength', label: 'Build strength' },
  { value: 'running', label: 'Start or improve running' },
  { value: 'weightLoss', label: 'Lose weight' },
  { value: 'general', label: 'General fitness' },
]

export const EQUIPMENT_LABELS: Record<Equipment, string> = { gym: 'Full gym', dumbbells: 'Dumbbells', bands: 'Resistance bands', bodyweight: 'Bodyweight' }

export const experienceLabel = (level: ExperienceLevel) => EXPERIENCE_OPTIONS.find((o) => o.value === level)?.label ?? level
export const goalLabel = (goal: MainGoal) => GOAL_OPTIONS.find((o) => o.value === goal)?.label ?? goal
