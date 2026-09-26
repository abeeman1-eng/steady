import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { Card, Screen } from '../../components/ui'
import { getActivePlan } from '../../data/repositories/planRepo'
import { formatDate } from '../../domain/dates'
import { PlanPreview } from '../onboarding/PlanPreview'

export function PlanScreen() {
  const plan = useLiveQuery(getActivePlan)

  return (
    <Screen
      title="Your plan"
      action={
        <Link to="/onboarding?edit=1" className="flex min-h-11 items-center rounded-xl px-3 text-accent hover:bg-surface-2">
          Change
        </Link>
      }
    >
      <Link to="/exercises" className="flex min-h-14 items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4 hover:bg-surface-2">
        <span>
          <span className="block font-semibold">Exercise guide</span>
          <span className="block text-sm text-muted">Look up any exercise: step-by-step form and muscles worked</span>
        </span>
        <span aria-hidden className="text-muted">›</span>
      </Link>
      {plan === null && (
        <Card>
          <p className="text-muted">No active plan.</p>
        </Card>
      )}
      {plan && (
        <>
          <p className="text-sm text-muted">Started {formatDate(plan.startDate, { month: 'long', day: 'numeric', year: 'numeric' })}. Repeats every week.</p>
          <PlanPreview plan={plan} linkExercises />
        </>
      )}
    </Screen>
  )
}
