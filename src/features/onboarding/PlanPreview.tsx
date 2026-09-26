import { Link } from 'react-router-dom'
import { Card } from '../../components/ui'
import { WEEKDAY_NAMES } from '../../domain/dates'
import { EXERCISES_BY_ID } from '../../domain/exerciseLibrary'
import type { GeneratedPlan, SessionTemplate } from '../../domain/types'
import { formatSetTarget } from '../../lib/format'

/** `linkExercises` makes exercise names open the exercise guide (off during onboarding so answers aren't lost). */
export function PlanPreview({ plan, linkExercises = false }: { plan: Pick<GeneratedPlan, 'summary' | 'weekly'>; linkExercises?: boolean }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="rounded-2xl bg-accent-soft p-4 text-lg font-semibold">{plan.summary}</p>
      {plan.weekly.map((s) => (
        <SessionTemplateCard key={s.weekday} session={s} linkExercises={linkExercises} />
      ))}
    </div>
  )
}

export function SessionTemplateCard({ session, linkExercises }: { session: SessionTemplate; linkExercises?: boolean }) {
  return (
    <Card>
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-semibold">{session.name}</h3>
        <span className="text-sm text-muted">{WEEKDAY_NAMES[session.weekday]}</span>
      </div>
      {session.targets.kind === 'strength' ? (
        <ul className="mt-2 flex flex-col gap-1 text-sm">
          {session.targets.exercises.map((t) => {
            const ex = EXERCISES_BY_ID.get(t.exerciseId)
            return (
              <li key={t.exerciseId} className="flex items-center justify-between gap-2">
                {linkExercises && ex ? (
                  <Link to={`/exercises/${ex.id}`} className="inline-flex min-h-11 items-center text-text underline decoration-neutral underline-offset-4 hover:text-accent">
                    {ex.name}
                  </Link>
                ) : (
                  <span>{ex?.name ?? t.exerciseId}</span>
                )}
                <span className="shrink-0 text-muted">{formatSetTarget(t.sets, t.repMin, t.repMax, ex?.timed)}</span>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-muted">
          {session.targets.durationMin} min · {session.targets.activity}. {session.targets.cue}.
        </p>
      )}
    </Card>
  )
}
