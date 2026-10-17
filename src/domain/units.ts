import type { Units } from './types'

const KG_PER_LB = 0.45359237
const CM_PER_IN = 2.54

export const kgToLb = (kg: number) => kg / KG_PER_LB
export const lbToKg = (lb: number) => lb * KG_PER_LB

const round1 = (n: number) => Math.round(n * 10) / 10

/** Weight in the user's display unit, rounded to 0.1. */
export function toDisplayWeight(kg: number, units: Units): number {
  return round1(units === 'imperial' ? kgToLb(kg) : kg)
}

export function fromDisplayWeight(value: number, units: Units): number {
  return units === 'imperial' ? lbToKg(value) : value
}

export const weightUnitLabel = (units: Units) => (units === 'imperial' ? 'lb' : 'kg')

export function formatWeight(kg: number, units: Units): string {
  return `${toDisplayWeight(kg, units)} ${weightUnitLabel(units)}`
}

/** Increment used by the +/- buttons on a set row. */
export const weightStep = (units: Units) => (units === 'imperial' ? 5 : 2.5)

export function cmToFeetInches(cm: number): { feet: number; inches: number } {
  const totalIn = Math.round(cm / CM_PER_IN)
  return { feet: Math.floor(totalIn / 12), inches: totalIn % 12 }
}

export const feetInchesToCm = (feet: number, inches: number) => (feet * 12 + inches) * CM_PER_IN

export function formatHeight(cm: number, units: Units): string {
  if (units === 'metric') return `${Math.round(cm)} cm`
  const { feet, inches } = cmToFeetInches(cm)
  return `${feet}′ ${inches}″`
}

// ----- Distance and pace (stored in meters and seconds) -----

export const METERS_PER_MILE = 1609.344
const metersPerUnit = (units: Units) => (units === 'imperial' ? METERS_PER_MILE : 1000)

export const distanceUnitLabel = (units: Units) => (units === 'imperial' ? 'mi' : 'km')

export const toDisplayDistance = (meters: number, units: Units) => meters / metersPerUnit(units)
export const fromDisplayDistance = (value: number, units: Units) => value * metersPerUnit(units)

/** "3.1 mi", "5 km", "21.1 km". Whole numbers drop the decimal. */
export function formatDistance(meters: number, units: Units, digits = 1): string {
  const v = toDisplayDistance(meters, units)
  const rounded = Math.round(v * 10 ** digits) / 10 ** digits
  return `${rounded} ${distanceUnitLabel(units)}`
}

/** Seconds per mile or kilometer; undefined when distance or time is missing. */
export function paceSecPerUnit(meters: number, durationSec: number, units: Units): number | undefined {
  const d = toDisplayDistance(meters, units)
  return d > 0 && durationSec > 0 ? durationSec / d : undefined
}

/** "9:41 /mi" */
export function formatPace(secPerUnit: number, units: Units): string {
  const total = Math.round(secPerUnit)
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')} /${distanceUnitLabel(units)}`
}
