import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, Chevron, Screen, inputClass } from '../../components/ui'
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
      {filtered.length > 0 && (
        <ul className="divide-y divide-border overflow-hidden rounded-[20px] bg-surface ring-1 ring-border ring-inset">
          {filtered.map((w) => (
            <li key={w.id}>
              <Link to={`/history/${w.id}`} className="flex items-start gap-3 px-4 py-3.5 transition hover:bg-surface-2">
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-[15px] font-medium">{w.name}</span>
                    <span className="shrink-0 text-[13px] text-muted">{formatDate(w.date)}</span>
                  </span>
                  {w.difficulty && (
                    <span className="mt-0.5 block text-[13px] text-muted">
                      Difficulty {w.difficulty} · {difficultyLabel(w.difficulty)}
                    </span>
                  )}
                  {w.notes && <span className="mt-1 line-clamp-2 block text-[14px] text-muted">{w.notes}</span>}
                </span>
                <span className="pt-1">
                  <Chevron />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Screen>
  )
}
