import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { BackButton } from '../../components/BackButton'
import { DifficultyPicker } from '../../components/DifficultyPicker'
import { Button, Card, Field, inputClass } from '../../components/ui'
import { getPlannedSession } from '../../data/repositories/planRepo'
import { logRun } from '../../data/repositories/workoutRepo'
import { formatDate, todayISO } from '../../domain/dates'
import { distanceUnitLabel, formatPace, fromDisplayDistance, paceSecPerUnit } from '../../domain/units'
import { useProfile } from '../../lib/profileContext'
import { runTargetAmount } from './runLabels'

/** Faster than this per km is beyond world-record pace, so the numbers are probably mistyped. */
const FASTEST_SANE_SEC_PER_KM = 150

/** Manual run entry: distance, time, calculated pace, difficulty and notes. */
export function LogRunScreen() {
  const [params] = useSearchParams()
  const sessionId = params.get('session') ?? undefined
  const session = useLiveQuery(async () => (sessionId ? ((await getPlannedSession(sessionId)) ?? null) : null), [sessionId])
  if (session === undefined) return null
  return <LogRunForm key={session?.id ?? 'free'} session={session} />
}

function LogRunForm({ session }: { session: Awaited<ReturnType<typeof getPlannedSession>> | null }) {
  const navigate = useNavigate()
  const { units } = useProfile()
  const today = todayISO()
  const target = session?.targets.kind === 'run' ? session.targets : undefined
  const [date, setDate] = useState(session && session.date <= today ? session.date : today)
  const [distance, setDistance] = useState('')
  const [time, setTime] = useState({ h: '', m: target?.durationMin ? String(target.durationMin) : '', s: '' })
  const [difficulty, setDifficulty] = useState<number>()
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const distanceM = fromDisplayDistance(parseFloat(distance), units)
  const durationSec = (parseInt(time.h, 10) || 0) * 3600 + (parseInt(time.m, 10) || 0) * 60 + (parseInt(time.s, 10) || 0)
  const pace = Number.isFinite(distanceM) ? paceSecPerUnit(distanceM, durationSec, units) : undefined
  const tooFast = pace !== undefined && durationSec / (distanceM / 1000) < FASTEST_SANE_SEC_PER_KM
  const valid = Number.isFinite(distanceM) && distanceM > 0 && distanceM <= 300_000 && durationSec > 0 && durationSec < 48 * 3600

  async function save() {
    if (!valid) return
    setSaving(true)
    setError(null)
    try {
      await logRun({ date, distanceM, durationSec, difficulty, notes: notes.trim() || undefined, plannedSessionId: session?.id })
      navigate('/', { replace: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong saving your run.')
      setSaving(false)
    }
  }

  const timeInput = (key: 'h' | 'm' | 's', label: string) => (
    <label className="flex flex-1 flex-col gap-1">
      <span className="text-[13px] text-muted">{label}</span>
      <input
        className={`${inputClass} text-center tabular-nums`}
        type="number"
        inputMode="numeric"
        min={0}
        max={key === 'h' ? 47 : 59}
        aria-label={`Time, ${label.toLowerCase()}`}
        value={time[key]}
        onChange={(e) => setTime((t) => ({ ...t, [key]: e.target.value }))}
      />
    </label>
  )

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col gap-6 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(6rem,env(safe-area-inset-bottom))]">
      <BackButton parent="/" parentLabel="Today" />
      <header>
        <h1 className="text-[28px] leading-tight font-semibold">Log a run</h1>
        {session && target ? (
          <p className="mt-1 text-muted">
            {session.name} · planned {runTargetAmount(target, units)} on {formatDate(session.date, { weekday: 'long', month: 'short', day: 'numeric' })}
            {session.status === 'missed' && ' (marked missed; logging it now counts it as done)'}
          </p>
        ) : (
          <p className="mt-1 text-muted">Any run, planned or not.</p>
        )}
      </header>

      <Field label="Date">
        <input className={inputClass} type="date" max={today} value={date} onChange={(e) => setDate(e.target.value || today)} />
      </Field>

      <Field label={`Distance (${units === 'imperial' ? 'miles' : 'kilometers'})`}>
        <input className={inputClass} type="number" inputMode="decimal" min={0} step="0.01" placeholder={units === 'imperial' ? 'e.g. 3.1' : 'e.g. 5'} value={distance} onChange={(e) => setDistance(e.target.value)} />
      </Field>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-[15px] font-medium">Time</legend>
        <div className="flex gap-3">
          {timeInput('h', 'Hours')}
          {timeInput('m', 'Minutes')}
          {timeInput('s', 'Seconds')}
        </div>
      </fieldset>

      <Card className="flex items-baseline justify-between bg-surface-2">
        <span className="text-muted">Pace</span>
        <span className="text-[20px] font-semibold tabular-nums" aria-live="polite">
          {pace ? formatPace(pace, units) : `–:–– /${distanceUnitLabel(units)}`}
        </span>
      </Card>
      {tooFast && (
        <p role="alert" className="-mt-4 text-[14px] text-gold">
          That pace is faster than a world record. Check the distance and time.
        </p>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">How hard was it?</h2>
        <DifficultyPicker value={difficulty} onChange={setDifficulty} />
        <p className="text-[13px] text-muted">Optional. Tap again to clear.</p>
      </section>

      <Field label="Notes (optional)">
        <textarea className={`${inputClass} min-h-28 py-2`} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Route, weather, how your legs felt…" />
      </Field>

      {error && (
        <p role="alert" className="text-danger">
          {error}
        </p>
      )}
      <Button block onClick={save} disabled={!valid || saving}>
        {saving ? 'Saving…' : 'Save run'}
      </Button>
      {!valid && <p className="-mt-4 text-center text-[13px] text-muted">Enter a distance and a time to save.</p>}
    </main>
  )
}
