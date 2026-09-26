import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CheckIcon, PRBadge } from '../../components/ui'
import { addSet, removeExercise, removeSet, setCompleted, updateSet } from '../../data/repositories/workoutRepo'
import type { SetRecord } from '../../data/schema'
import { EXERCISES_BY_ID } from '../../domain/exerciseLibrary'
import type { Units } from '../../domain/types'
import { fromDisplayWeight, toDisplayWeight, weightStep, weightUnitLabel } from '../../domain/units'
import { unlockAudio, vibrate } from '../../lib/alerts'

export function ExerciseBlock({
  workoutId,
  order,
  sets,
  units,
  onSetCompleted,
  onSwap,
}: {
  workoutId: string
  order: number
  sets: SetRecord[]
  units: Units
  onSetCompleted: () => void
  onSwap: () => void
}) {
  const exercise = EXERCISES_BY_ID.get(sets[0].exerciseId)
  const [showInfo, setShowInfo] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const target = sets[0].repMin !== undefined ? `${sets[0].repMin}${sets[0].repMax !== sets[0].repMin ? `–${sets[0].repMax}` : ''}${exercise?.timed ? ' sec' : ' reps'}` : null

  return (
    <Card className="p-0">
      <div className="flex items-start gap-2 p-4 pb-2">
        <button type="button" className="min-h-11 flex-1 text-left" onClick={() => setShowInfo((v) => !v)} aria-expanded={showInfo}>
          <h2 className="text-lg font-semibold">{exercise?.name ?? 'Unknown exercise'}</h2>
          <p className="text-sm text-muted">
            {target ? `Target ${target} · ` : ''}
            <span className="text-accent">{showInfo ? 'Hide tips' : 'How to'}</span>
          </p>
        </button>
        <div className="relative">
          <button type="button" onClick={() => setMenuOpen((v) => !v)} className="min-h-11 min-w-11 rounded-xl text-xl text-muted hover:bg-surface-2" aria-label={`Options for ${exercise?.name}`} aria-expanded={menuOpen}>
            ⋯
          </button>
          {menuOpen && (
            <div className="absolute right-0 z-10 mt-1 w-44 overflow-hidden rounded-[14px] bg-surface-2 ring-1 ring-border ring-inset shadow-lg">
              <button type="button" className="block min-h-11 w-full px-4 text-left hover:bg-border" onClick={() => (setMenuOpen(false), onSwap())}>
                Swap exercise
              </button>
              <button
                type="button"
                className="block min-h-11 w-full px-4 text-left text-danger hover:bg-border"
                onClick={() => {
                  setMenuOpen(false)
                  if (confirm(`Remove ${exercise?.name ?? 'this exercise'} from this workout?`)) void removeExercise(workoutId, order)
                }}
              >
                Remove exercise
              </button>
            </div>
          )}
        </div>
      </div>

      {showInfo && exercise && (
        <div className="mx-4 mb-3 rounded-xl bg-surface-2 p-3 text-sm">
          <ol className="list-decimal pl-5">
            {exercise.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <Link to={`/exercises/${exercise.id}`} className="mt-2 inline-flex min-h-11 items-center text-accent">
            Full guide and muscles worked ›
          </Link>
        </div>
      )}

      <div className="grid grid-cols-[2rem_1fr_1fr_3rem] items-center gap-2 px-4 pb-1 text-xs text-muted">
        <span>Set</span>
        <span>{exercise?.isBodyweight ? `+${weightUnitLabel(units)}` : weightUnitLabel(units)}</span>
        <span>{exercise?.timed ? 'Sec' : 'Reps'}</span>
        <span className="sr-only">Done</span>
      </div>
      <ol className="flex flex-col gap-1 px-4">
        {sets.map((s) => (
          <SetRow key={s.id} set={s} units={units} bodyweight={!!exercise?.isBodyweight} onCompleted={onSetCompleted} />
        ))}
      </ol>
      <div className="flex gap-2 p-2">
        <button type="button" onClick={() => addSet(workoutId, order)} className="min-h-11 flex-1 rounded-xl text-accent hover:bg-surface-2">
          + Add set
        </button>
        {sets.length > 1 && (
          <button type="button" onClick={() => removeSet(sets[sets.length - 1].id)} className="min-h-11 flex-1 rounded-xl text-muted hover:bg-surface-2">
            Remove last set
          </button>
        )}
      </div>
    </Card>
  )
}

function SetRow({ set, units, bodyweight, onCompleted }: { set: SetRecord; units: Units; bodyweight: boolean; onCompleted: () => void }) {
  const [weight, setWeight] = useState(set.weightKg === null || (bodyweight && set.weightKg === 0) ? '' : String(toDisplayWeight(set.weightKg, units)))
  const [reps, setReps] = useState(String(set.reps))

  function commitWeight(text: string) {
    setWeight(text)
    const n = parseFloat(text)
    void updateSet(set.id, { weightKg: Number.isFinite(n) && n >= 0 ? fromDisplayWeight(n, units) : bodyweight ? 0 : null })
  }

  function commitReps(text: string) {
    setReps(text)
    const n = parseInt(text, 10)
    void updateSet(set.id, { reps: Number.isFinite(n) && n >= 0 ? n : 0 })
  }

  async function toggle() {
    unlockAudio()
    const completing = !set.completed
    const hits = await setCompleted(set.id, completing)
    if (completing) {
      onCompleted()
      if (hits.length) vibrate(50)
    }
  }

  const inputBase = 'min-h-11 w-full rounded-lg border bg-surface-2 px-2 text-center text-lg tabular-nums focus:ring-2 focus:ring-accent focus:outline-none'

  return (
    <li className={`grid grid-cols-[2rem_1fr_1fr_3rem] items-center gap-2 rounded-lg py-1 ${set.completed ? 'opacity-90' : ''}`}>
      <span className="flex flex-col items-start text-sm font-semibold text-muted">
        {set.setNumber}
        {set.isPR && <PRBadge className="mt-0.5" />}
      </span>
      <div className="relative">
        <input
          type="number"
          inputMode="decimal"
          step={weightStep(units)}
          aria-label={`Set ${set.setNumber} ${bodyweight ? 'added weight' : 'weight'} in ${weightUnitLabel(units)}`}
          placeholder={bodyweight ? 'BW' : '–'}
          value={weight}
          onChange={(e) => commitWeight(e.target.value)}
          onFocus={(e) => e.target.select()}
          className={`${inputBase} ${set.completed ? 'border-accent/40' : 'border-border'}`}
        />
      </div>
      <input
        type="number"
        inputMode="numeric"
        aria-label={`Set ${set.setNumber} reps`}
        value={reps}
        onChange={(e) => commitReps(e.target.value)}
        onFocus={(e) => e.target.select()}
        className={`${inputBase} ${set.completed ? 'border-accent/40' : 'border-border'}`}
      />
      <button
        type="button"
        onClick={toggle}
        aria-pressed={set.completed}
        aria-label={`Mark set ${set.setNumber} ${set.completed ? 'not done' : 'done'}`}
        className={`flex min-h-11 w-12 items-center justify-center rounded-lg border-2 transition ${
          set.completed ? 'border-accent bg-accent text-accent-ink' : 'border-neutral text-transparent hover:border-accent'
        }`}
      >
        <CheckIcon className="size-6" />
      </button>
    </li>
  )
}
