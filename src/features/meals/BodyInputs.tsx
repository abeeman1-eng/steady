import { useState } from 'react'
import { Button, Field, inputClass } from '../../components/ui'
import { addBodyWeight } from '../../data/repositories/bodyRepo'
import { updateProfile } from '../../data/repositories/profileRepo'
import { formatDate, todayISO } from '../../domain/dates'
import { ageFromBirth, isMinor, needsBirthMonth } from '../../domain/targets'
import { cmToFeetInches, feetInchesToCm, formatHeight, formatWeight, fromDisplayWeight, weightUnitLabel } from '../../domain/units'
import { useProfile } from '../../lib/profileContext'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

/**
 * Birth month and year. Age is worked out to the month (ageFromBirth), so someone born in
 * December 2008 isn't treated as 18 until December 2026. Years back to age 5 are accepted so
 * younger users see the under-18 notice instead of a field that ignores them. If the result is
 * under 18, any saved nutrition targets are cleared.
 */
export function BirthDateField() {
  const profile = useProfile()
  const thisYear = new Date().getFullYear()

  function save(changes: { birthYear?: number; birthMonth?: number }) {
    const next = { birthYear: profile.birthYear, birthMonth: profile.birthMonth, ...changes }
    const minor = isMinor(ageFromBirth(next))
    void updateProfile(minor ? { ...changes, nutritionTargets: undefined, nutritionTargetsBasis: undefined } : changes)
  }

  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1.5 text-[13px] font-medium text-muted">Birth month and year</legend>
      <div className="grid grid-cols-[3fr_2fr] gap-2">
        <select
          aria-label="Birth month"
          value={profile.birthMonth ?? ''}
          onChange={(e) => e.target.value && save({ birthMonth: Number(e.target.value) })}
          className={`${inputClass} appearance-none`}
        >
          <option value="" disabled>
            Month
          </option>
          {MONTHS.map((m, i) => (
            <option key={m} value={i + 1}>
              {m}
            </option>
          ))}
        </select>
        <input
          className={inputClass}
          type="number"
          inputMode="numeric"
          aria-label="Birth year"
          placeholder="Year"
          min={thisYear - 100}
          max={thisYear - 5}
          defaultValue={profile.birthYear ?? ''}
          onChange={(e) => {
            const y = parseInt(e.target.value, 10)
            if (y >= thisYear - 100 && y <= thisYear - 5) save({ birthYear: y })
          }}
        />
      </div>
      {needsBirthMonth(profile) && <span className="text-xs text-subtle">Add your birth month so your age is exact.</span>}
    </fieldset>
  )
}

/** Height with inline editing, saved to the profile. */
export function HeightField() {
  const { heightCm, units } = useProfile()
  const [editing, setEditing] = useState(!heightCm)
  const init = heightCm ? cmToFeetInches(heightCm) : undefined
  const [ft, setFt] = useState(init ? String(init.feet) : '')
  const [inch, setInch] = useState(init ? String(init.inches) : '')
  const [cm, setCm] = useState(heightCm ? String(Math.round(heightCm)) : '')

  if (!editing && heightCm) {
    return (
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-muted">Height</span>
        <span className="flex items-center gap-3 text-[15px]">
          {formatHeight(heightCm, units)}
          <button type="button" onClick={() => setEditing(true)} className="min-h-11 text-[14px] font-medium text-accent">
            Edit
          </button>
        </span>
      </div>
    )
  }

  const save = () => {
    const value = units === 'imperial' ? (parseFloat(ft) > 0 ? feetInchesToCm(parseFloat(ft), parseFloat(inch) || 0) : NaN) : parseFloat(cm)
    if (value > 90 && value < 250) {
      void updateProfile({ heightCm: value })
      setEditing(false)
    }
  }

  return (
    <Field label="Height">
      <div className="flex gap-2">
        {units === 'imperial' ? (
          <>
            <input className={inputClass} type="number" inputMode="numeric" placeholder="ft" aria-label="Feet" value={ft} onChange={(e) => setFt(e.target.value)} />
            <input className={inputClass} type="number" inputMode="numeric" placeholder="in" aria-label="Inches" value={inch} onChange={(e) => setInch(e.target.value)} />
          </>
        ) : (
          <input className={inputClass} type="number" inputMode="numeric" placeholder="cm" aria-label="Centimeters" value={cm} onChange={(e) => setCm(e.target.value)} />
        )}
        <Button variant="secondary" onClick={save}>
          Save
        </Button>
      </div>
    </Field>
  )
}

/** Latest body weight with a quick "update" that logs today's weight. */
export function WeightField({ latestKg, latestDate }: { latestKg?: number; latestDate?: string }) {
  const { units } = useProfile()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState('')

  if (latestKg && !editing) {
    return (
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-muted">Weight</span>
        <span className="flex items-center gap-3 text-[15px]">
          <span>
            {formatWeight(latestKg, units)} <span className="text-[13px] text-subtle">· {latestDate === todayISO() ? 'today' : formatDate(latestDate!)}</span>
          </span>
          <button type="button" onClick={() => setEditing(true)} className="min-h-11 text-[14px] font-medium text-accent">
            Update
          </button>
        </span>
      </div>
    )
  }

  return (
    <Field label={`Today’s weight (${weightUnitLabel(units)})`}>
      <div className="flex gap-2">
        <input className={inputClass} type="number" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} />
        <Button
          variant="secondary"
          onClick={async () => {
            const n = parseFloat(value)
            if (!(n > 0)) return
            await addBodyWeight(todayISO(), fromDisplayWeight(n, units))
            setEditing(false)
            setValue('')
          }}
        >
          Save
        </Button>
      </div>
    </Field>
  )
}
