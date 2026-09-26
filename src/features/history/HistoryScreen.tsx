import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, Screen, inputClass } from '../../components/ui'
import { listCompletedWorkouts } from '../../data/repositories/workoutRepo'
import { formatDate } from '../../domain/dates'
import { difficultyLabel } from '../../lib/format'

export function HistoryScreen() {
  const workouts = useLiveQuery(listCompletedWorkouts)
  const [query, setQuery] = useState('')

  const q = query.trim().toLowerCase()
  const filtered = (workouts ?? []).filter((w) => !q || (w.notes ?? '').toLowerCase().includes(q) || w.name.toLowerCase().includes(q))

  return (
    <Screen title="History">
      <input className={inputClass} type="search" placeholder="Search notes" aria-label="Search workout notes" value={query} onChange={(e) => setQuery(e.target.value)} />
      {workouts && workouts.length === 0 && (
        <Card>
          <p className="text-muted">Finished workouts will show up here.</p>
        </Card>
      )}
      {workouts && workouts.length > 0 && filtered.length === 0 && <p className="text-muted">No workouts match “{query}”.</p>}
      <ul className="flex flex-col gap-2">
        {filtered.map((w) => (
          <li key={w.id}>
            <Link to={`/history/${w.id}`} className="block rounded-2xl border border-border bg-surface p-4 hover:bg-surface-2">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-semibold">{w.name}</span>
                <span className="shrink-0 text-sm text-muted">{formatDate(w.date)}</span>
              </div>
              {w.difficulty && (
                <p className="text-sm text-muted">
                  Difficulty {w.difficulty} · {difficultyLabel(w.difficulty)}
                </p>
              )}
              {w.notes && <p className="mt-1 line-clamp-2 text-sm">{w.notes}</p>}
            </Link>
          </li>
        ))}
      </ul>
    </Screen>
  )
}
