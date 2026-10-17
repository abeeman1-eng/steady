import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { Card, ListGroup, ListRow, Screen } from '../../components/ui'
import { getActivePlan, getPlannedBetween } from '../../data/repositories/planRepo'
import { formatDate, todayISO } from '../../domain/dates'
import { useProfile } from '../../lib/profileContext'
import { PlanPreview } from '../onboarding/PlanPreview'
import { RunningPlanOverview } from '../running/RunningPlanOverview'

export function PlanScreen() {
  const { units } = useProfile()
  const plan = useLiveQuery(getActivePlan)
  const today = todayISO()
  const statuses = useLiveQuery(async () => (plan?.type === 'running' && plan.goalDate ? getPlannedBetween(plan.startDate, plan.goalDate) : []), [plan?.id])

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
        <ListRow title="Log a run" subtitle="Distance, time and how it felt" to="/runs/log" />
      </ListGroup>
      {plan === null && (
        <Card>
          <p className="text-muted">No active plan.</p>
        </Card>
      )}
      {plan?.type === 'running' && (
        <>
          <p className="text-sm text-muted">Started {formatDate(plan.startDate, { month: 'long', day: 'numeric', year: 'numeric' })}. Missed days stay marked; the plan carries on from where you are.</p>
          <RunningPlanOverview plan={plan} units={units} today={today} statuses={statuses} openWeekOf={today} />
        </>
      )}
      {plan && plan.type !== 'running' && (
        <>
          <p className="text-sm text-muted">Started {formatDate(plan.startDate, { month: 'long', day: 'numeric', year: 'numeric' })}. Repeats every week.</p>
          <PlanPreview plan={plan} units={units} linkExercises />
        </>
      )}
    </Screen>
  )
}
