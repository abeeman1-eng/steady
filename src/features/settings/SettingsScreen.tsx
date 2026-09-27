import { useLiveQuery } from 'dexie-react-hooks'
import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, ChoiceList, Field, ListGroup, ListRow, SectionTitle, Screen, Toggle, inputClass } from '../../components/ui'
import { BackupError, downloadBackup, importBackup, parseBackup, requestPersistentStorage } from '../../data/backup'
import { addBodyWeight, getLatestBodyWeight } from '../../data/repositories/bodyRepo'
import { updateProfile } from '../../data/repositories/profileRepo'
import { formatDate, todayISO } from '../../domain/dates'
import type { Units } from '../../domain/types'
import { formatHeight, formatWeight, fromDisplayWeight, weightUnitLabel } from '../../domain/units'
import { DIET_STYLES } from '../../domain/foodCatalog'
import { EQUIPMENT_LABELS, experienceLabel, goalLabel } from '../../lib/labels'
import { useNutritionTargets } from '../../lib/useNutritionTargets'
import { useProfile } from '../../lib/profileContext'
import { BodyStatsStep } from '../onboarding/BodyStatsStep'

export function SettingsScreen() {
  const profile = useProfile()
  const latestWeight = useLiveQuery(getLatestBodyWeight)

  return (
    <Screen title="Settings">
      <section className="flex flex-col gap-2">
        <SectionTitle>Training</SectionTitle>
        <Card className="flex flex-col gap-3">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            <dt className="text-muted">Experience</dt>
            <dd>{experienceLabel(profile.experienceLevel)}</dd>
            <dt className="text-muted">{profile.goals.length > 1 ? 'Goals' : 'Goal'}</dt>
            <dd>{profile.goals.map(goalLabel).join(', ')}</dd>
            <dt className="text-muted">Days per week</dt>
            <dd>{profile.daysPerWeek}</dd>
            <dt className="text-muted">Equipment</dt>
            <dd>{profile.equipment.map((e) => EQUIPMENT_LABELS[e]).join(', ')}</dd>
            {profile.runningGoal && (
              <>
                <dt className="text-muted">Running goal</dt>
                <dd>
                  {profile.runningGoal.label} by {formatDate(profile.runningGoal.date, { month: 'short', day: 'numeric', year: 'numeric' })}
                </dd>
              </>
            )}
          </dl>
          <Link to="/onboarding?edit=1" className="inline-flex min-h-12 items-center justify-center rounded-[14px] bg-surface-3 px-4 text-[15px] font-semibold hover:bg-border-strong">
            Change answers and regenerate plan
          </Link>
        </Card>
      </section>

      <section className="flex flex-col gap-2">
        <SectionTitle>Units</SectionTitle>
        <ChoiceList<Units>
          label="Units"
          value={profile.units}
          onChange={(units) => updateProfile({ units })}
          options={[
            { value: 'imperial', label: 'Imperial (lb, miles)' },
            { value: 'metric', label: 'Metric (kg, km)' },
          ]}
        />
      </section>

      <section className="flex flex-col gap-2">
        <SectionTitle>Rest timer</SectionTitle>
        <Card className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <span>Default rest</span>
            <div className="flex items-center gap-2">
              <Button variant="secondary" className="min-w-11 px-0" aria-label="15 seconds less" onClick={() => updateProfile({ restTimerSec: Math.max(15, profile.restTimerSec - 15) })}>
                −
              </Button>
              <span className="w-16 text-center tabular-nums" aria-live="polite">
                {profile.restTimerSec} sec
              </span>
              <Button variant="secondary" className="min-w-11 px-0" aria-label="15 seconds more" onClick={() => updateProfile({ restTimerSec: Math.min(600, profile.restTimerSec + 15) })}>
                +
              </Button>
            </div>
          </div>
          <Toggle
            label="Sound and vibration"
            description="Plays when rest is over. iPhone browsers only support sound."
            checked={profile.restTimerAlerts}
            onChange={(restTimerAlerts) => updateProfile({ restTimerAlerts })}
          />
        </Card>
      </section>

      <section className="flex flex-col gap-2">
        <SectionTitle>Body</SectionTitle>
        <BodySection latestWeightKg={latestWeight?.weightKg} latestDate={latestWeight?.date} />
      </section>

      <section className="flex flex-col gap-2">
        <SectionTitle>Meals</SectionTitle>
        <MealsSection />
      </section>

      <section className="flex flex-col gap-2">
        <SectionTitle>Your data</SectionTitle>
        <DataSection />
      </section>
    </Screen>
  )
}

function MealsSection() {
  const profile = useProfile()
  const enabled = profile.showMeals !== false
  const { targets: t, minor } = useNutritionTargets()
  const summary = t && Object.keys(t).length
    ? [t.calories && `${Math.round(t.calories).toLocaleString()} cal`, t.proteinG && `${Math.round(t.proteinG)} g protein`].filter(Boolean).join(' · ') || `${Object.keys(t).length} set`
    : 'Not set'
  return (
    <div className="flex flex-col gap-2">
      <Card className="!py-3">
        <Toggle label="Meal tracking" description="Show food logging on the Today screen" checked={enabled} onChange={(showMeals) => updateProfile({ showMeals })} />
      </Card>
      {enabled && (
        <ListGroup>
          {!minor && <ListRow title="Build my plan" subtitle="Guided targets and a sample day of meals" to="/meals/plan" />}
          <ListRow title="Daily targets" subtitle={minor ? 'For 18 and over' : summary} to="/meals/targets" />
          <ListRow title="Meal ideas" subtitle={DIET_STYLES.find((d) => d.value === (profile.dietStyle ?? 'any'))!.label} to="/meals/ideas" />
          <ListRow title="Food log" subtitle="Today’s meals and totals" to="/meals" />
        </ListGroup>
      )}
    </div>
  )
}

function BodySection({ latestWeightKg, latestDate }: { latestWeightKg?: number; latestDate?: string }) {
  const profile = useProfile()
  const [editing, setEditing] = useState(false)
  const [stats, setStats] = useState({ heightCm: profile.heightCm, build: profile.build })
  const [weight, setWeight] = useState('')
  const [logged, setLogged] = useState(false)

  return (
    <Card className="flex flex-col gap-4">
      {editing ? (
        <>
          <BodyStatsStep units={profile.units} value={stats} onChange={(v) => setStats({ heightCm: v.heightCm, build: v.build })} showWeight={false} />
          <div className="flex gap-2">
            <Button
              onClick={async () => {
                await updateProfile(stats)
                setEditing(false)
              }}
            >
              Save
            </Button>
            <Button variant="ghost" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm">
            <span className="text-muted">Height </span>
            {profile.heightCm ? formatHeight(profile.heightCm, profile.units) : '–'}
            <span className="ml-4 text-muted">Build </span>
            {profile.build ? profile.build[0].toUpperCase() + profile.build.slice(1) : '–'}
          </p>
          <Button variant="ghost" onClick={() => setEditing(true)}>
            Edit
          </Button>
        </div>
      )}

      <form
        className="flex items-end gap-2"
        onSubmit={async (e) => {
          e.preventDefault()
          const n = parseFloat(weight)
          if (!Number.isFinite(n) || n <= 0) return
          await addBodyWeight(todayISO(), fromDisplayWeight(n, profile.units))
          setWeight('')
          setLogged(true)
        }}
      >
        <div className="flex-1">
          <Field label={`Log today’s weight (${weightUnitLabel(profile.units)})`} hint={latestWeightKg && latestDate ? `Last: ${formatWeight(latestWeightKg, profile.units)} on ${formatDate(latestDate)}` : undefined}>
            <input
              className={inputClass}
              type="number"
              inputMode="decimal"
              value={weight}
              onChange={(e) => {
                setWeight(e.target.value)
                setLogged(false)
              }}
            />
          </Field>
        </div>
        <Button type="submit" variant="secondary" className={latestWeightKg ? 'mb-5' : ''}>
          Log
        </Button>
      </form>
      {logged && (
        <p role="status" className="-mt-2 text-sm text-accent">
          Saved
        </p>
      )}
    </Card>
  )
}

function DataSection() {
  const profile = useProfile()
  const fileRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)
  const [busy, setBusy] = useState(false)

  async function onImport(file: File) {
    setMessage(null)
    try {
      const backup = parseBackup(await file.text())
      const when = new Date(backup.exportedAt).toLocaleString()
      if (!confirm(`Replace everything in Steady on this device with the backup from ${when}? This can’t be undone.`)) return
      setBusy(true)
      await importBackup(backup)
      setMessage({ kind: 'ok', text: 'Backup restored.' })
    } catch (e) {
      setMessage({ kind: 'error', text: e instanceof BackupError ? e.message : 'Could not read that file.' })
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <Card className="flex flex-col gap-3">
      <p className="text-sm">
        Your data lives <strong>only on this device, in this browser</strong>. Clearing browser data or switching browsers won’t bring it along, so export a backup now and then.
      </p>
      <p className="text-sm text-muted">
        Last backup: {profile.lastBackupAt ? new Date(profile.lastBackupAt).toLocaleDateString() : 'never'}
        <br />
        Protected storage:{' '}
        {profile.persistentStorage ? (
          'on'
        ) : (
          <button
            type="button"
            className="inline-flex min-h-11 items-center text-accent underline"
            onClick={async () => updateProfile({ persistentStorage: await requestPersistentStorage() })}
          >
            not granted, try again
          </button>
        )}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          disabled={busy}
          onClick={async () => {
            setBusy(true)
            await downloadBackup().finally(() => setBusy(false))
            setMessage({ kind: 'ok', text: 'Backup downloaded.' })
          }}
        >
          Export backup
        </Button>
        <Button variant="secondary" disabled={busy} onClick={() => fileRef.current?.click()}>
          Import backup
        </Button>
        <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => e.target.files?.[0] && onImport(e.target.files[0])} />
      </div>
      {message && (
        <p role={message.kind === 'error' ? 'alert' : 'status'} className={`text-sm ${message.kind === 'error' ? 'text-danger' : 'text-accent'}`}>
          {message.text}
        </p>
      )}
    </Card>
  )
}
