import { useEffect, useMemo, useRef, useState } from 'react'
import { Toggle, inputClass } from '../../components/ui'
import { EXERCISE_LIBRARY, EXERCISES_BY_ID, expandEquipment, isAvailable } from '../../domain/exerciseLibrary'
import type { Equipment, ExerciseDef } from '../../domain/types'

const EQUIPMENT_LABEL: Record<Equipment, string> = { gym: 'Gym', dumbbells: 'Dumbbells', bands: 'Bands', bodyweight: 'Bodyweight' }

export function ExercisePicker({
  title,
  equipment,
  substitutesFor,
  onPick,
  onClose,
}: {
  title: string
  equipment: Equipment[]
  /** When swapping, show this exercise's substitutes first. */
  substitutesFor?: string
  onPick: (exerciseId: string) => void
  onClose: () => void
}) {
  const [query, setQuery] = useState('')
  const [mineOnly, setMineOnly] = useState(true)
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const d = dialogRef.current
    d?.showModal()
    return () => d?.close()
  }, [])

  const available = useMemo(() => expandEquipment(equipment), [equipment])
  const matches = (e: ExerciseDef) =>
    (!mineOnly || isAvailable(e, available)) &&
    (query.trim() === '' || `${e.name} ${e.muscleGroups.join(' ')}`.toLowerCase().includes(query.trim().toLowerCase()))

  const substitutes = substitutesFor
    ? (EXERCISES_BY_ID.get(substitutesFor)?.substituteIds ?? []).map((id) => EXERCISES_BY_ID.get(id)!).filter(matches)
    : []
  const rest = EXERCISE_LIBRARY.filter((e) => e.id !== substitutesFor && !substitutes.includes(e) && matches(e)).sort((a, b) => a.name.localeCompare(b.name))

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-label={title}
      className="m-0 h-dvh max-h-none w-full max-w-none bg-bg p-0 text-text backdrop:bg-black/60 sm:m-auto sm:h-[85dvh] sm:max-w-xl sm:rounded-2xl"
    >
      <div className="flex h-full flex-col">
        <div className="flex flex-col gap-3 border-b border-border p-4 pt-[max(1rem,env(safe-area-inset-top))]">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">{title}</h2>
            <button type="button" onClick={onClose} className="min-h-11 rounded-xl px-3 text-accent">
              Cancel
            </button>
          </div>
          <input className={inputClass} type="search" placeholder="Search exercises or muscles" aria-label="Search exercises" value={query} onChange={(e) => setQuery(e.target.value)} />
          <Toggle label="Only my equipment" checked={mineOnly} onChange={setMineOnly} />
        </div>
        <div className="flex-1 overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {substitutes.length > 0 && (
            <>
              <h3 className="mb-2 text-sm font-semibold text-muted uppercase">Suggested swaps</h3>
              <ExerciseList items={substitutes} onPick={onPick} />
              <h3 className="mt-4 mb-2 text-sm font-semibold text-muted uppercase">All exercises</h3>
            </>
          )}
          <ExerciseList items={rest} onPick={onPick} />
          {substitutes.length === 0 && rest.length === 0 && <p className="text-muted">No exercises match.</p>}
        </div>
      </div>
    </dialog>
  )
}

function ExerciseList({ items, onPick }: { items: ExerciseDef[]; onPick: (id: string) => void }) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((e) => (
        <li key={e.id}>
          <button type="button" onClick={() => onPick(e.id)} className="w-full rounded-2xl bg-surface ring-1 ring-border ring-inset p-3 text-left hover:bg-surface-2">
            <span className="block font-medium">{e.name}</span>
            <span className="block text-sm text-muted">
              {e.equipment.map((q) => EQUIPMENT_LABEL[q]).join(', ')} · {e.muscleGroups.join(', ')}
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}
