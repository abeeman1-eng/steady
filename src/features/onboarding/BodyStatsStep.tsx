import { useState } from 'react'
import { ChoiceList, Field, inputClass } from '../../components/ui'
import type { Build, Units } from '../../domain/types'
import { cmToFeetInches, feetInchesToCm, fromDisplayWeight, toDisplayWeight } from '../../domain/units'

export interface BodyStats {
  heightCm?: number
  weightKg?: number
  build?: Build
}

const num = (s: string) => {
  const n = parseFloat(s)
  return Number.isFinite(n) && n > 0 ? n : undefined
}

/** Height, weight and build inputs in the user's units. Used in onboarding and settings. */
export function BodyStatsStep({ units, value, onChange, showWeight = true }: { units: Units; value: BodyStats; onChange: (v: BodyStats) => void; showWeight?: boolean }) {
  const initialFtIn = value.heightCm ? cmToFeetInches(value.heightCm) : undefined
  const [feet, setFeet] = useState(initialFtIn ? String(initialFtIn.feet) : '')
  const [inches, setInches] = useState(initialFtIn ? String(initialFtIn.inches) : '')
  const [cm, setCm] = useState(value.heightCm ? String(Math.round(value.heightCm)) : '')
  const [weight, setWeight] = useState(value.weightKg ? String(toDisplayWeight(value.weightKg, units)) : '')

  function updateHeightImperial(f: string, i: string) {
    setFeet(f)
    setInches(i)
    const ft = num(f)
    onChange({ ...value, heightCm: ft ? feetInchesToCm(ft, num(i) ?? 0) : undefined })
  }

  return (
    <div className="flex flex-col gap-4">
      {units === 'imperial' ? (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Height (feet)">
            <input className={inputClass} inputMode="numeric" type="number" min={3} max={8} value={feet} onChange={(e) => updateHeightImperial(e.target.value, inches)} />
          </Field>
          <Field label="Inches">
            <input className={inputClass} inputMode="numeric" type="number" min={0} max={11} value={inches} onChange={(e) => updateHeightImperial(feet, e.target.value)} />
          </Field>
        </div>
      ) : (
        <Field label="Height (cm)">
          <input
            className={inputClass}
            inputMode="numeric"
            type="number"
            value={cm}
            onChange={(e) => {
              setCm(e.target.value)
              onChange({ ...value, heightCm: num(e.target.value) })
            }}
          />
        </Field>
      )}
      {showWeight && (
        <Field label={`Current body weight (${units === 'imperial' ? 'lb' : 'kg'})`}>
          <input
            className={inputClass}
            inputMode="decimal"
            type="number"
            value={weight}
            onChange={(e) => {
              setWeight(e.target.value)
              const w = num(e.target.value)
              onChange({ ...value, weightKg: w ? fromDisplayWeight(w, units) : undefined })
            }}
          />
        </Field>
      )}
      <div className="flex flex-col gap-2">
        <span className="text-sm text-muted">Build</span>
        <ChoiceList<Build>
          label="Build"
          value={value.build}
          onChange={(b) => onChange({ ...value, build: value.build === b ? undefined : b })}
          options={[
            { value: 'slim', label: 'Slim' },
            { value: 'average', label: 'Average' },
            { value: 'athletic', label: 'Athletic' },
            { value: 'heavier', label: 'Heavier' },
          ]}
        />
      </div>
    </div>
  )
}
