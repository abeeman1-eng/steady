import { describe, expect, it } from 'vitest'
import { needsBackupReminder } from './backupReminder'
import { addDays, startOfWeek } from './dates'
import { cmToFeetInches, feetInchesToCm, fromDisplayWeight, toDisplayWeight } from './units'

describe('units', () => {
  it('round-trips pounds through kilograms without drift', () => {
    for (const lb of [5, 45, 102.5, 225, 315]) {
      expect(toDisplayWeight(fromDisplayWeight(lb, 'imperial'), 'imperial')).toBe(lb)
    }
  })

  it('leaves metric weights alone', () => {
    expect(fromDisplayWeight(62.5, 'metric')).toBe(62.5)
  })

  it('converts height', () => {
    expect(cmToFeetInches(feetInchesToCm(5, 10))).toEqual({ feet: 5, inches: 10 })
  })
})

describe('dates', () => {
  it('finds Monday of the week', () => {
    expect(startOfWeek('2026-09-26')).toBe('2026-09-21') // Saturday → Monday
    expect(startOfWeek('2026-09-27')).toBe('2026-09-21') // Sunday belongs to the week before
    expect(startOfWeek('2026-09-21')).toBe('2026-09-21')
  })

  it('adds days across month ends', () => {
    expect(addDays('2026-09-30', 1)).toBe('2026-10-01')
  })
})

describe('needsBackupReminder', () => {
  const now = new Date('2026-09-26T12:00:00Z')
  it('reminds 30 days after the last backup', () => {
    expect(needsBackupReminder({ lastBackupAt: '2026-08-27T12:00:00Z' }, now)).toBe(true)
    expect(needsBackupReminder({ lastBackupAt: '2026-09-01T12:00:00Z' }, now)).toBe(false)
  })

  it('falls back to onboarding date and respects snoozing', () => {
    expect(needsBackupReminder({ onboardedAt: '2026-07-01T00:00:00Z' }, now)).toBe(true)
    expect(needsBackupReminder({ onboardedAt: '2026-07-01T00:00:00Z', backupReminderSnoozedUntil: '2026-10-01T00:00:00Z' }, now)).toBe(false)
  })
})
