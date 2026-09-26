import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { Card, ListGroup, ListRow, Screen } from '../../components/ui'
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
      <ListGroup>
        <ListRow title="Exercise guide" subtitle="Step-by-step form and muscles worked" to="/exercises" />
      </ListGroup>
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
