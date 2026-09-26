import { Link, useNavigate, useParams } from 'react-router-dom'
import { Card, SectionTitle } from '../../components/ui'
import { EXERCISES_BY_ID } from '../../domain/exerciseLibrary'
import { MUSCLE_LABELS } from '../../domain/exerciseSearch'
import { EQUIPMENT_LABELS } from '../../lib/labels'

const DIFFICULTY_LABEL = { 1: 'Beginner-friendly', 2: 'Intermediate', 3: 'Advanced technique' } as const

export function ExerciseDetailScreen() {
  const { exerciseId = '' } = useParams()
  const navigate = useNavigate()
  const exercise = EXERCISES_BY_ID.get(exerciseId)

  if (!exercise) {
    return (
      <main className="mx-auto max-w-xl p-4">
        <p className="text-muted">That exercise isn’t in the guide.</p>
        <Link to="/exercises" className="text-accent">
          Back to the exercise guide
        </Link>
      </main>
    )
  }

  const [main, ...also] = exercise.muscleGroups
  const alternatives = exercise.substituteIds.slice(0, 4).map((id) => EXERCISES_BY_ID.get(id)!)

  return (
    <main className="mx-auto w-full max-w-xl px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-28">
      {/* Back returns to wherever the user came from: search results, the plan, or a workout. */}
      <button type="button" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/exercises'))} className="inline-flex min-h-11 items-center text-accent">
        ← Back
      </button>
      <h1 className="text-2xl font-bold">{exercise.name}</h1>
      <p className="mt-1 text-muted">{exercise.description}</p>
      <ul className="mt-3 flex flex-wrap gap-2 text-sm" aria-label="Details">
        <li className="rounded-full bg-surface-2 px-3 py-1">{DIFFICULTY_LABEL[exercise.difficulty]}</li>
        <li className="rounded-full bg-surface-2 px-3 py-1">{exercise.equipment.map((e) => EQUIPMENT_LABELS[e]).join(' or ')}</li>
        {exercise.timed && <li className="rounded-full bg-surface-2 px-3 py-1">Timed hold</li>}
      </ul>

      <div className="mt-5 flex flex-col gap-4">
        <section className="flex flex-col gap-2">
          <SectionTitle>Muscles worked</SectionTitle>
          <Card className="flex flex-col gap-2">
            <p>
              <span className="text-sm text-muted">Main focus: </span>
              <span className="font-semibold">{MUSCLE_LABELS[main].name}</span> <span className="text-muted">({MUSCLE_LABELS[main].where})</span>
            </p>
            {also.length > 0 && (
              <p>
                <span className="text-sm text-muted">Also works: </span>
                {also.map((m, i) => (
                  <span key={m}>
                    {i > 0 && ', '}
                    <span className="font-medium">{MUSCLE_LABELS[m].name}</span> <span className="text-muted">({MUSCLE_LABELS[m].where})</span>
                  </span>
                ))}
              </p>
            )}
          </Card>
        </section>

        <section className="flex flex-col gap-2">
          <SectionTitle>How to do it</SectionTitle>
          <Card>
            <ol className="flex flex-col gap-3">
              {exercise.steps.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span aria-hidden className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent">
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </Card>
        </section>

        <section className="flex flex-col gap-2">
          <SectionTitle>Form tips</SectionTitle>
          <Card>
            <ul className="flex list-disc flex-col gap-1 pl-5">
              {exercise.formCues.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </Card>
        </section>

        {alternatives.length > 0 && (
          <section className="flex flex-col gap-2">
            <SectionTitle>Alternatives</SectionTitle>
            <ul className="flex flex-col gap-2">
              {alternatives.map((a) => (
                <li key={a.id}>
                  <Link to={`/exercises/${a.id}`} replace className="flex min-h-12 items-center justify-between rounded-xl border border-border bg-surface px-4 hover:bg-surface-2">
                    <span>{a.name}</span>
                    <span className="text-sm text-muted">{a.equipment.map((e) => EQUIPMENT_LABELS[e]).join(', ')}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  )
}
