import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { DifficultyPicker } from '../../components/DifficultyPicker'
import { Button, Card, Field, PRBadge, inputClass } from '../../components/ui'
import { deleteWorkout, getRunForWorkout, getSetsForWorkout, getWorkout, updateRun, updateWorkoutDetails } from '../../data/repositories/workoutRepo'
import type { RunRecord, WorkoutRecord } from '../../data/schema'
import { formatDate } from '../../domain/dates'
import { EXERCISES_BY_ID } from '../../domain/exerciseLibrary'
import type { Units } from '../../domain/types'
import { formatDistance, formatPace, formatWeight, fromDisplayDistance, paceSecPerUnit, toDisplayDistance } from '../../domain/units'
import { formatDuration } from '../../lib/format'
import { useProfile } from '../../lib/profileContext'
import { BackButton } from '../../components/BackButton'

export function WorkoutDetailScreen() {
  const { workoutId = '' } = useParams()
  const workout = useLiveQuery(() => getWorkout(workoutId), [workoutId])
  const sets = useLiveQuery(() => getSetsForWorkout(workoutId), [workoutId])
  const run = useLiveQuery(() => getRunForWorkout(workoutId), [workoutId])
  const { units } = useProfile()
  const navigate = useNavigate()

  if (workout === undefined || sets === undefined || run === undefined) return null
  if (!workout) return <p className="p-4 text-muted">Workout not found.</p>

  const byExercise = new Map<number, typeof sets>()
  for (const s of sets) byExercise.set(s.order, [...(byExercise.get(s.order) ?? []), s])

  return (
    <main className="mx-auto w-full max-w-xl px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-28">
      <BackButton parent="/history" parentLabel="History" className="mb-2" />
      <h1 className="text-[28px] leading-tight font-semibold">{workout.name}</h1>
      <p className="mb-4 text-muted">{formatDate(workout.date, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>

      <div className="flex flex-col gap-3">
        {run && <RunDetails key={run.updatedAt} run={run} units={units} />}
        {!run && workout.durationSec && (
          <Card>
            <p>Time: {formatDuration(workout.durationSec)}</p>
          </Card>
        )}
        {[...byExercise.values()].map((group) => {
          const ex = EXERCISES_BY_ID.get(group[0].exerciseId)
          return (
            <Card key={group[0].id}>
              <h2 className="font-semibold">{ex?.name}</h2>
              <ol className="mt-2 flex flex-col gap-1 text-sm">
                {group.map((s) => (
                  <li key={s.id} className={`flex items-center gap-2 ${s.completed ? '' : 'text-muted line-through'}`}>
                    <span className="w-6 text-muted">{s.setNumber}</span>
                    <span>
                      {s.weightKg ? `${formatWeight(s.weightKg, units)} × ` : ex?.isBodyweight ? 'BW × ' : ''}
                      {s.reps}
                      {ex?.timed ? ' sec' : ''}
                    </span>
                    {s.isPR && <PRBadge />}
                  </li>
                ))}
              </ol>
            </Card>
          )
        })}
        <EditDetails key={workout.updatedAt} workout={workout} />
        <Button
          variant="ghost"
          block
          className="text-danger"
          onClick={async () => {
            if (!confirm(`Delete ${workout.name} from ${formatDate(workout.date)}? This can't be undone.`)) return
            await deleteWorkout(workout.id)
            navigate('/history', { replace: true })
          }}
        >
          Delete {run ? 'run' : 'workout'}
        </Button>
      </div>
    </main>
  )
}

function EditDetails({ workout }: { workout: WorkoutRecord }) {
  const [difficulty, setDifficulty] = useState(workout.difficulty)
  const [notes, setNotes] = useState(workout.notes ?? '')
  const [saved, setSaved] = useState(false)
  const dirty = difficulty !== workout.difficulty || notes !== (workout.notes ?? '')

  return (
    <Card className="flex flex-col gap-4">
      <h2 className="font-semibold">Difficulty and notes</h2>
      <DifficultyPicker
        value={difficulty}
        onChange={(d) => {
          setDifficulty(d)
          setSaved(false)
        }}
      />
      <Field label="Notes">
        <textarea
          className={`${inputClass} min-h-28 py-2`}
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value)
            setSaved(false)
          }}
        />
      </Field>
      <Button
        disabled={!dirty}
        onClick={async () => {
          await updateWorkoutDetails(workout.id, { difficulty, notes: notes.trim() || undefined })
          setSaved(true)
        }}
      >
        Save changes
      </Button>
      {saved && !dirty && (
        <p role="status" className="text-sm text-accent">
          Saved
        </p>
      )}
    </Card>
  )
}

/** Distance, time and pace of a logged run, with a way to fix a typo. */
function RunDetails({ run, units }: { run: RunRecord; units: Units }) {
  const [editing, setEditing] = useState(false)
  const [distance, setDistance] = useState(String(+toDisplayDistance(run.distanceM, units).toFixed(2)))
  const [minutes, setMinutes] = useState(String(Math.floor(run.durationSec / 60)))
  const [seconds, setSeconds] = useState(String(run.durationSec % 60))
  const pace = paceSecPerUnit(run.distanceM, run.durationSec, units)
  const distanceM = fromDisplayDistance(parseFloat(distance), units)
  const durationSec = (parseInt(minutes, 10) || 0) * 60 + (parseInt(seconds, 10) || 0)
  const valid = Number.isFinite(distanceM) && distanceM > 0 && durationSec > 0

  return (
    <Card className="flex flex-col gap-3">
      <dl className="grid grid-cols-3 gap-2 text-center">
        <div>
          <dt className="text-[13px] text-muted">Distance</dt>
          <dd className="text-[18px] font-semibold tabular-nums">{formatDistance(run.distanceM, units, 2)}</dd>
        </div>
        <div>
          <dt className="text-[13px] text-muted">Time</dt>
          <dd className="text-[18px] font-semibold tabular-nums">{formatDuration(run.durationSec)}</dd>
        </div>
        <div>
          <dt className="text-[13px] text-muted">Pace</dt>
          <dd className="text-[18px] font-semibold tabular-nums">{pace ? formatPace(pace, units) : '–'}</dd>
        </div>
      </dl>
      {editing ? (
        <div className="flex flex-col gap-3">
          <Field label={`Distance (${units === 'imperial' ? 'miles' : 'kilometers'})`}>
            <input className={inputClass} type="number" inputMode="decimal" value={distance} onChange={(e) => setDistance(e.target.value)} />
          </Field>
          <div className="flex gap-3">
            <Field label="Minutes">
              <input className={inputClass} type="number" inputMode="numeric" value={minutes} onChange={(e) => setMinutes(e.target.value)} />
            </Field>
            <Field label="Seconds">
              <input className={inputClass} type="number" inputMode="numeric" value={seconds} onChange={(e) => setSeconds(e.target.value)} />
            </Field>
          </div>
          <div className="flex gap-2">
            <Button
              disabled={!valid}
              onClick={async () => {
                await updateRun(run.workoutId, { distanceM, durationSec })
                setEditing(false)
              }}
            >
              Save
            </Button>
            <Button variant="ghost" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="secondary" onClick={() => setEditing(true)}>
          Edit distance or time
        </Button>
      )}
    </Card>
  )
}
