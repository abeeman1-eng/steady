import { Link, useSearchParams } from 'react-router-dom'
import { Card, Screen, SectionTitle, inputClass } from '../../components/ui'
import { EXERCISE_LIBRARY } from '../../domain/exerciseLibrary'
import { MUSCLE_LABELS, searchExercises } from '../../domain/exerciseSearch'
import type { ExerciseDef, MovementPattern } from '../../domain/types'

const BROWSE_GROUPS: { title: string; patterns: MovementPattern[] }[] = [
  { title: 'Legs and glutes', patterns: ['squat', 'hinge', 'lunge'] },
  { title: 'Chest and shoulders (push)', patterns: ['horizontalPush', 'verticalPush'] },
  { title: 'Back (pull)', patterns: ['horizontalPull', 'verticalPull'] },
  { title: 'Arms and shoulders', patterns: ['biceps', 'triceps', 'shoulders'] },
  { title: 'Core', patterns: ['core'] },
]

export function ExerciseGuideScreen() {
  const [params, setParams] = useSearchParams()
  const query = params.get('q') ?? ''
  const results = query.trim() ? searchExercises(query, EXERCISE_LIBRARY) : null

  return (
    <Screen title="Exercise guide">
      <p className="-mt-2 text-muted">Type an exercise to see how to do it step by step and which muscles it works.</p>
      <input
        className={inputClass}
        type="search"
        enterKeyHint="search"
        placeholder="e.g. squat, RDL, push-up, glutes"
        aria-label="Search exercises"
        value={query}
        onChange={(e) => setParams(e.target.value ? { q: e.target.value } : {}, { replace: true })}
      />

      {results === null ? (
        BROWSE_GROUPS.map((g) => (
          <section key={g.title} className="flex flex-col gap-2">
            <SectionTitle>{g.title}</SectionTitle>
            <ExerciseLinks items={EXERCISE_LIBRARY.filter((e) => g.patterns.includes(e.pattern)).sort((a, b) => a.difficulty - b.difficulty || a.name.localeCompare(b.name))} />
          </section>
        ))
      ) : results.length > 0 ? (
        <section className="flex flex-col gap-2" aria-live="polite">
          <SectionTitle>
            {results.length} {results.length === 1 ? 'match' : 'matches'}
          </SectionTitle>
          <ExerciseLinks items={results} />
        </section>
      ) : (
        <Card>
          <p className="font-medium">No guide for “{query.trim()}” yet</p>
          <p className="mt-1 text-sm text-muted">
            Try a shorter name (like “row” or “press”) or a muscle (like “glutes” or “abs”). Clear the search to browse all {EXERCISE_LIBRARY.length} exercises.
          </p>
        </Card>
      )}
    </Screen>
  )
}

function ExerciseLinks({ items }: { items: ExerciseDef[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((e) => (
        <li key={e.id}>
          <Link to={`/exercises/${e.id}`} className="flex min-h-14 items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3 hover:bg-surface-2">
            <span>
              <span className="block font-medium">{e.name}</span>
              <span className="block text-sm text-muted">{e.muscleGroups.map((m) => MUSCLE_LABELS[m].name).join(', ')}</span>
            </span>
            <span aria-hidden className="text-muted">
              ›
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
