import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { DifficultyPicker } from '../../components/DifficultyPicker'
import { Button, Field, inputClass } from '../../components/ui'
import { finishWorkout, getSetsForWorkout, getWorkout } from '../../data/repositories/workoutRepo'

export function FinishScreen() {
  const { workoutId = '' } = useParams()
  const navigate = useNavigate()
  const workout = useLiveQuery(() => getWorkout(workoutId), [workoutId])
  const sets = useLiveQuery(() => getSetsForWorkout(workoutId), [workoutId])
  const [difficulty, setDifficulty] = useState<number>()
  const [notes, setNotes] = useState('')
  const [minutes, setMinutes] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  if (!workout || !sets) return null
  const isCardio = workout.type === 'cardio'
  const durationText = minutes ?? String(workout.cardioTarget?.durationMin ?? '')
  const skipped = sets.filter((s) => !s.completed).length
  const prs = sets.filter((s) => s.isPR).length

  async function save(withRating: boolean) {
    setSaving(true)
    const mins = parseFloat(durationText)
    await finishWorkout(workoutId, {
      difficulty: withRating ? difficulty : undefined,
      notes: notes.trim() || undefined,
      durationSec: isCardio && Number.isFinite(mins) && mins > 0 ? Math.round(mins * 60) : undefined,
    })
    navigate('/', { replace: true })
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col gap-6 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
      <header className="flex items-center justify-between">
        <button type="button" onClick={() => navigate(-1)} className="min-h-11 rounded-xl px-2 text-accent">
          ← Back
        </button>
      </header>
      <div>
        <h1 className="text-[28px] leading-tight font-semibold">Nice work</h1>
        <p className="mt-1 text-muted">
          {workout.name}
          {!isCardio && ` · ${sets.length - skipped} sets done`}
          {prs > 0 && ` · ${prs} PR${prs > 1 ? 's' : ''}`}
        </p>
        {!isCardio && skipped > 0 && <p className="mt-1 text-sm text-muted">{skipped} unchecked sets will be saved as skipped.</p>}
      </div>

      {isCardio && (
        <Field label="How many minutes?">
          <input className={inputClass} type="number" inputMode="decimal" value={durationText} onChange={(e) => setMinutes(e.target.value)} />
        </Field>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">How hard was it?</h2>
        <DifficultyPicker value={difficulty} onChange={setDifficulty} />
      </section>

      <Field label="Notes (optional)">
        <textarea className={`${inputClass} min-h-28 py-2`} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="How did it feel? Anything to remember next time?" />
      </Field>

      <div className="mt-auto flex flex-col gap-2">
        <Button block onClick={() => save(true)} disabled={saving}>
          {saving ? 'Saving…' : 'Save workout'}
        </Button>
        {difficulty === undefined && (
          <Button block variant="ghost" onClick={() => save(false)} disabled={saving}>
            Skip rating
          </Button>
        )}
      </div>
    </main>
  )
}
