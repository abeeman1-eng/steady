import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { DifficultyPicker } from '../../components/DifficultyPicker'
import { Button, Card, Field, PRBadge, inputClass } from '../../components/ui'
import { getSetsForWorkout, getWorkout, updateWorkoutDetails } from '../../data/repositories/workoutRepo'
import type { WorkoutRecord } from '../../data/schema'
import { formatDate } from '../../domain/dates'
import { EXERCISES_BY_ID } from '../../domain/exerciseLibrary'
import { formatWeight } from '../../domain/units'
import { formatDuration } from '../../lib/format'
import { useProfile } from '../../lib/profileContext'

export function WorkoutDetailScreen() {
  const { workoutId = '' } = useParams()
  const workout = useLiveQuery(() => getWorkout(workoutId), [workoutId])
  const sets = useLiveQuery(() => getSetsForWorkout(workoutId), [workoutId])
  const { units } = useProfile()

  if (workout === undefined || sets === undefined) return null
  if (!workout) return <p className="p-4 text-muted">Workout not found.</p>

  const byExercise = new Map<number, typeof sets>()
  for (const s of sets) byExercise.set(s.order, [...(byExercise.get(s.order) ?? []), s])

  return (
    <main className="mx-auto w-full max-w-xl px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-28">
      <Link to="/history" className="inline-flex min-h-11 items-center text-accent">
        ← History
      </Link>
      <h1 className="text-[28px] leading-tight font-semibold">{workout.name}</h1>
      <p className="mb-4 text-muted">{formatDate(workout.date, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>

      <div className="flex flex-col gap-3">
        {workout.durationSec && (
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
