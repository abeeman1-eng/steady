import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Card, Field, Section, Segmented, inputClass } from '../../components/ui'
import { addBodyWeight, getLatestBodyWeight } from '../../data/repositories/bodyRepo'
import { updateProfile } from '../../data/repositories/profileRepo'
import { formatDate, todayISO } from '../../domain/dates'
import { NUTRIENT_KEYS, NUTRIENTS, type NutrientKey, type Nutrition } from '../../domain/nutrition'
import { ACTIVITY_LEVELS, type ActivityLevel, type Sex, ageFromBirthYear, birthYearFromAge, suggestTargets } from '../../domain/targets'
import { cmToFeetInches, feetInchesToCm, formatHeight, formatWeight, fromDisplayWeight, weightUnitLabel } from '../../domain/units'
import { goalLabel } from '../../lib/labels'
import { useProfile } from '../../lib/profileContext'

type Draft = Record<NutrientKey, string>

const toDraft = (t?: Partial<Nutrition>): Draft => Object.fromEntries(NUTRIENT_KEYS.map((k) => [k, t?.[k] !== undefined ? String(Math.round(t[k]!)) : ''])) as Draft

export function TargetsScreen() {
  const profile = useProfile()
  const navigate = useNavigate()
  const latest = useLiveQuery(getLatestBodyWeight)
  const [draft, setDraft] = useState<Draft>(() => toDraft(profile.nutritionTargets))
  const [saved, setSaved] = useState(false)

  const age = profile.birthYear ? ageFromBirthYear(profile.birthYear) : undefined
  const ready = profile.sex && age && profile.activityLevel && profile.heightCm && latest
  const suggestion = ready
    ? suggestTargets({ sex: profile.sex!, age: age!, heightCm: profile.heightCm!, weightKg: latest!.weightKg, activity: profile.activityLevel!, goals: profile.goals })
    : null

  const set = (k: NutrientKey, v: string) => {
    setDraft((d) => ({ ...d, [k]: v }))
    setSaved(false)
  }

  async function save() {
    const targets: Partial<Nutrition> = {}
    for (const k of NUTRIENT_KEYS) {
      const n = parseFloat(draft[k])
      if (Number.isFinite(n) && n > 0) targets[k] = n
    }
    const any = Object.keys(targets).length > 0
    await updateProfile({
      nutritionTargets: any ? targets : undefined,
      nutritionTargetsBasis: any && latest ? { weightKg: latest.weightKg, setAt: new Date().toISOString() } : undefined,
    })
    setSaved(true)
  }

  return (
    <main className="mx-auto w-full max-w-xl px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-32">
      <button type="button" onClick={() => navigate(-1)} className="-ml-1 mb-2 inline-flex min-h-11 items-center px-1 text-[15px] font-medium text-accent">
        ‹ Back
      </button>
      <header className="mb-6">
        <h1 className="text-[28px] leading-tight font-semibold">Daily targets</h1>
        <p className="mt-2 text-[15px] text-muted">Steady can suggest targets from your details. You decide the numbers, and you can edit any of them.</p>
      </header>

      <div className="flex flex-col gap-6">
        <Section title="About you">
          <Card className="flex flex-col gap-5">
            <Field label="Sex" hint="Only used in the calorie formula.">
              <Segmented<Sex>
                label="Sex"
                value={profile.sex}
                onChange={(sex) => updateProfile({ sex })}
                options={[
                  { value: 'female', label: 'Female' },
                  { value: 'male', label: 'Male' },
                  { value: 'unspecified', label: 'Prefer not to say' },
                ]}
              />
            </Field>
            <Field label="Age">
              <input
                className={inputClass}
                type="number"
                inputMode="numeric"
                min={13}
                max={100}
                defaultValue={age ?? ''}
                onChange={(e) => {
                  const n = parseInt(e.target.value, 10)
                  if (n >= 13 && n <= 100) void updateProfile({ birthYear: birthYearFromAge(n) })
                }}
              />
            </Field>
            {age !== undefined && age < 18 && <p className="-mt-3 text-[13px] text-muted">These formulas are designed for adults. For teens, a doctor or dietitian can give better guidance.</p>}
            <HeightField />
            <WeightField latestKg={latest?.weightKg} latestDate={latest?.date} />
          </Card>
        </Section>

        <Section title="Activity level">
          <div role="radiogroup" aria-label="Activity level" className="divide-y divide-border overflow-hidden rounded-[20px] bg-surface ring-1 ring-border ring-inset">
            {(Object.keys(ACTIVITY_LEVELS) as ActivityLevel[]).map((a) => {
              const on = profile.activityLevel === a
              return (
                <button key={a} type="button" role="radio" aria-checked={on} onClick={() => updateProfile({ activityLevel: a })} className="flex min-h-14 w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-surface-2">
                  <span>
                    <span className="block text-[15px]">{ACTIVITY_LEVELS[a].label}</span>
                    <span className="mt-0.5 block text-[13px] text-muted">{ACTIVITY_LEVELS[a].hint}</span>
                  </span>
                  <span aria-hidden className={`size-5 shrink-0 rounded-full ${on ? 'border-[6px] border-accent' : 'ring-2 ring-neutral ring-inset'}`} />
                </button>
              )
            })}
          </div>
          <p className="px-1 text-[13px] text-subtle">Count your Steady workouts too.</p>
        </Section>

        <Section
          title="Your targets"
          action={
            suggestion && (
              <button type="button" onClick={() => setDraft(toDraft(suggestion.targets))} className="inline-flex min-h-11 items-center text-[13px] font-medium text-accent">
                Use all suggestions
              </button>
            )
          }
        >
          {suggestion ? (
            <Card className="!py-4">
              <p className="text-[14px] text-muted">
                Maintenance is about <span className="font-semibold text-text tabular-nums">{suggestion.maintenance.toLocaleString()}</span> calories a day. For your goals (
                {profile.goals.map(goalLabel).join(', ').toLowerCase()}), Steady suggests {suggestion.adjustmentReason}.
              </p>
            </Card>
          ) : (
            <Card className="!py-4">
              <p className="text-[14px] text-muted">Fill in the details above to see suggestions. You can also type your own targets below.</p>
            </Card>
          )}

          <ul className="divide-y divide-border overflow-hidden rounded-[20px] bg-surface ring-1 ring-border ring-inset">
            {NUTRIENT_KEYS.map((k) => {
              const meta = NUTRIENTS[k]
              const suggested = suggestion?.targets[k]
              const differs = suggested !== undefined && String(suggested) !== draft[k]
              return (
                <li key={k} className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <label htmlFor={`target-${k}`} className="block text-[15px]">
                      {meta.label}
                      {meta.limit && <span className="ml-2 rounded-md bg-surface-3 px-1.5 py-0.5 align-middle text-[11px] font-medium text-muted">Limit</span>}
                    </label>
                    {suggestion && <p className="mt-0.5 text-[12px] text-subtle">{suggestion.why[k]}</p>}
                    {differs && (
                      <button type="button" onClick={() => set(k, String(suggested))} className="inline-flex min-h-11 items-center text-[13px] font-medium text-accent">
                        Use {suggested!.toLocaleString()} {meta.unit === 'kcal' ? 'cal' : meta.unit}
                      </button>
                    )}
                  </div>
                  <div className="flex w-32 shrink-0 items-center gap-2">
                    <input
                      id={`target-${k}`}
                      className={`${inputClass} !min-h-11 text-right tabular-nums`}
                      type="number"
                      inputMode="numeric"
                      min={0}
                      placeholder="–"
                      value={draft[k]}
                      onChange={(e) => set(k, e.target.value)}
                    />
                    <span className="w-8 text-[13px] text-muted">{meta.unit === 'kcal' ? 'cal' : meta.unit}</span>
                  </div>
                </li>
              )
            })}
          </ul>
          <p className="px-1 text-[13px] text-subtle">Leave any blank to just see the total without a target.</p>
        </Section>

        <div className="flex flex-col gap-2">
          <Button block onClick={save}>
            Save targets
          </Button>
          {saved && (
            <p role="status" className="text-center text-[14px] text-accent">
              Saved. <Link to="/meals" className="underline">Back to food log</Link>
            </p>
          )}
          <Button
            block
            variant="ghost"
            onClick={() => {
              setDraft(toDraft(undefined))
              setSaved(false)
            }}
          >
            Clear all
          </Button>
        </div>

        <p className="px-1 text-[12px] leading-relaxed text-subtle">
          Suggestions use the Mifflin-St Jeor equation and common dietary guidelines. They’re estimates for healthy adults, not medical advice. If you’re pregnant, breastfeeding, managing a health condition or
          under 18, check with a doctor or registered dietitian.
        </p>
      </div>
    </main>
  )
}

function HeightField() {
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

function WeightField({ latestKg, latestDate }: { latestKg?: number; latestDate?: string }) {
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
