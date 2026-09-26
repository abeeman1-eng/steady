import { useState } from 'react'
import { ChoiceList, Field, inputClass } from '../../components/ui'
import type { RunningGoal } from '../../data/schema'
import { addDays, todayISO } from '../../domain/dates'
import type { Units } from '../../domain/types'

const METERS_PER_MILE = 1609.344

const PRESETS: { label: Exclude<RunningGoal['label'], 'Custom'>; distanceM: number }[] = [
  { label: '5K', distanceM: 5000 },
  { label: '10K', distanceM: 10000 },
  { label: 'Half marathon', distanceM: 21097.5 },
  { label: 'Marathon', distanceM: 42195 },
]

export function RunningGoalStep({ units, value, onChange }: { units: Units; value?: RunningGoal; onChange: (g: RunningGoal | undefined) => void }) {
  const [label, setLabel] = useState<RunningGoal['label'] | undefined>(value?.label)
  const [custom, setCustom] = useState(value?.label === 'Custom' ? String(+(value.distanceM / (units === 'imperial' ? METERS_PER_MILE : 1000)).toFixed(2)) : '')
  const [date, setDate] = useState(value?.date ?? '')

  function emit(l = label, c = custom, d = date) {
    const preset = PRESETS.find((p) => p.label === l)
    const customM = parseFloat(c) * (units === 'imperial' ? METERS_PER_MILE : 1000)
    const distanceM = preset ? preset.distanceM : Number.isFinite(customM) && customM > 0 ? customM : undefined
    onChange(l && distanceM && d ? { label: l, distanceM, date: d } : undefined)
  }

  return (
    <div className="flex flex-col gap-4">
      <ChoiceList<RunningGoal['label']>
        label="Target distance"
        value={label}
        onChange={(l) => {
          setLabel(l)
          emit(l)
        }}
        options={[...PRESETS.map((p) => ({ value: p.label, label: p.label })), { value: 'Custom' as const, label: 'Custom distance' }]}
      />
      {label === 'Custom' && (
        <Field label={`Distance (${units === 'imperial' ? 'miles' : 'km'})`}>
          <input
            className={inputClass}
            type="number"
            inputMode="decimal"
            value={custom}
            onChange={(e) => {
              setCustom(e.target.value)
              emit(label, e.target.value)
            }}
          />
        </Field>
      )}
      <Field label="Target date">
        <input
          className={inputClass}
          type="date"
          min={addDays(todayISO(), 1)}
          value={date}
          onChange={(e) => {
            setDate(e.target.value)
            emit(label, custom, e.target.value)
          }}
        />
      </Field>
    </div>
  )
}
