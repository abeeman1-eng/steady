import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button, Card } from '../../components/ui'
import { addExercise, discardWorkout, getSetsForWorkout, getWorkout, swapExercise } from '../../data/repositories/workoutRepo'
import type { SetRecord } from '../../data/schema'
import { useProfile } from '../../lib/profileContext'
import { ExerciseBlock } from './ExerciseBlock'
import { ExercisePicker } from './ExercisePicker'
import { RestTimerBar } from './RestTimerBar'
import { useRestTimer } from './useRestTimer'

type PickerState = { mode: 'add' } | { mode: 'swap'; order: number; exerciseId: string } | null

export function SessionScreen() {
  const { workoutId = '' } = useParams()
  const navigate = useNavigate()
  const profile = useProfile()
  const workout = useLiveQuery(() => getWorkout(workoutId), [workoutId])
  const sets = useLiveQuery(() => getSetsForWorkout(workoutId), [workoutId])
  const timer = useRestTimer(workoutId, profile.restTimerAlerts)
  const [picker, setPicker] = useState<PickerState>(null)

  if (workout === undefined || sets === undefined) return null
  if (!workout || workout.status === 'completed') {
    return (
      <main className="mx-auto max-w-xl p-4">
        <p className="text-muted">This workout isn’t in progress.</p>
        <Link to="/" className="text-accent">
          Back to Today
        </Link>
      </main>
    )
  }

  const groups = groupByExercise(sets)
  const doneCount = sets.filter((s) => s.completed).length

  async function discard() {
    if (!confirm('Discard this workout? Everything logged in it will be deleted.')) return
    await discardWorkout(workoutId)
    navigate('/', { replace: true })
  }

  return (
    <>
      <main className="mx-auto w-full max-w-xl px-4 pt-[max(0.5rem,env(safe-area-inset-top))] pb-32">
        <header className="sticky top-0 z-10 -mx-4 mb-4 flex min-h-14 items-center gap-2 border-b border-border bg-bg/95 px-2 backdrop-blur">
          <Link to="/" className="flex min-h-11 items-center rounded-xl px-2 text-accent" aria-label="Back to Today (your workout is saved)">
            ← Today
          </Link>
          <div className="min-w-0 flex-1 text-center">
            <h1 className="truncate font-semibold">{workout.name}</h1>
            {workout.type === 'strength' && (
              <p className="text-xs text-muted">
                {doneCount}/{sets.length} sets
              </p>
            )}
          </div>
          <Button onClick={() => navigate(`/session/${workoutId}/finish`)} className="px-3">
            Finish
          </Button>
        </header>

        {workout.type === 'cardio' && workout.cardioTarget ? (
          <Card>
            <p className="text-3xl font-bold">{workout.cardioTarget.durationMin} min</p>
            <p className="mt-2">{workout.cardioTarget.activity}</p>
            <p className="mt-1 text-muted">{workout.cardioTarget.cue}</p>
            <p className="mt-4 text-sm text-muted">Tap Finish when you’re done to log your time and how it felt.</p>
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            {groups.length === 0 && (
              <Card>
                <p className="text-muted">No exercises yet. Add one to get started.</p>
              </Card>
            )}
            {groups.map(({ order, sets: s }) => (
              <ExerciseBlock
                key={`${order}-${s[0].exerciseId}`}
                workoutId={workoutId}
                order={order}
                sets={s}
                units={profile.units}
                onSetCompleted={() => timer.start(profile.restTimerSec)}
                onSwap={() => setPicker({ mode: 'swap', order, exerciseId: s[0].exerciseId })}
              />
            ))}
            <Button variant="secondary" block onClick={() => setPicker({ mode: 'add' })}>
              + Add exercise
            </Button>
          </div>
        )}

        <Button variant="ghost" block className="mt-8 text-danger" onClick={discard}>
          Discard workout
        </Button>
      </main>

      <RestTimerBar timer={timer} />

      {picker && (
        <ExercisePicker
          title={picker.mode === 'add' ? 'Add exercise' : 'Swap exercise'}
          equipment={profile.equipment}
          substitutesFor={picker.mode === 'swap' ? picker.exerciseId : undefined}
          onClose={() => setPicker(null)}
          onPick={async (id) => {
            const p = picker
            setPicker(null)
            if (p.mode === 'add') await addExercise(workoutId, id)
            else await swapExercise(workoutId, p.order, id)
          }}
        />
      )}
    </>
  )
}

function groupByExercise(sets: SetRecord[]): { order: number; sets: SetRecord[] }[] {
  const map = new Map<number, SetRecord[]>()
  for (const s of sets) map.set(s.order, [...(map.get(s.order) ?? []), s])
  return [...map.entries()].sort(([a], [b]) => a - b).map(([order, s]) => ({ order, sets: s }))
}
