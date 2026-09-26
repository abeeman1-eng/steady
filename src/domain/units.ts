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
