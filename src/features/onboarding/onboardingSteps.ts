export type StepId = 'experience' | 'goal' | 'days' | 'equipment' | 'units' | 'body' | 'running' | 'review'

/**
 * Edit mode (changing answers from Settings) only applies to someone who has already onboarded.
 * A shared or bookmarked "?edit=1" link opened by a first-time visitor must run the full flow,
 * or units and body stats are never asked and no plan can be built.
 */
export const isEditMode = (editParam: string | null, hasProfile: boolean) => editParam === '1' && hasProfile

/** Steps in order. Editing skips units and body stats, which live in Settings. */
export function onboardingSteps({ editing, running }: { editing: boolean; running: boolean }): StepId[] {
  const steps: StepId[] = ['experience', 'goal', 'days', 'equipment']
  if (!editing) steps.push('units', 'body')
  if (running) steps.push('running')
  steps.push('review')
  return steps
}
