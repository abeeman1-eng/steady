import { describe, expect, it } from 'vitest'
import { isEditMode, onboardingSteps } from './onboardingSteps'

describe('isEditMode', () => {
  it('ignores ?edit=1 for a first-time visitor with no profile', () => {
    expect(isEditMode('1', false)).toBe(false)
  })

  it('edits only when the link asks and a profile exists', () => {
    expect(isEditMode('1', true)).toBe(true)
    expect(isEditMode(null, true)).toBe(false)
    expect(isEditMode('0', true)).toBe(false)
  })
})

describe('onboardingSteps', () => {
  it('asks all seven questions for a new user who runs', () => {
    expect(onboardingSteps({ editing: false, running: true })).toEqual(['experience', 'goal', 'days', 'equipment', 'units', 'body', 'running', 'review'])
  })

  it('always asks units for a first-time visitor, even from an ?edit=1 link', () => {
    const steps = onboardingSteps({ editing: isEditMode('1', false), running: false })
    expect(steps).toContain('units')
    expect(steps).toHaveLength(7)
  })

  it('skips units and body stats when editing', () => {
    expect(onboardingSteps({ editing: true, running: false })).toEqual(['experience', 'goal', 'days', 'equipment', 'review'])
  })
})
