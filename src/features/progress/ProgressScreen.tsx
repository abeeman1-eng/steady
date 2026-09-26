import { useLiveQuery } from 'dexie-react-hooks'
import { Card, ListGroup, ListRow, PRBadge, Screen, SectionTitle } from '../../components/ui'
import { listPersonalRecords } from '../../data/repositories/recordsRepo'
import { formatDate } from '../../domain/dates'
import { EXERCISES_BY_ID } from '../../domain/exerciseLibrary'
import { describePR } from '../../lib/format'
import { useProfile } from '../../lib/profileContext'

export function ProgressScreen() {
  const { units } = useProfile()
  const prs = useLiveQuery(listPersonalRecords)

  return (
    <Screen title="Progress">
      <section className="flex flex-col gap-2">
        <SectionTitle>Personal records</SectionTitle>
        {prs && prs.length === 0 && (
          <Card>
            <p className="text-muted">Your first session with each exercise sets a baseline. Beat it next time and your PRs will show up here.</p>
          </Card>
        )}
        {prs && prs.length > 0 && (
          <ListGroup>
            {prs.map((pr) => {
              const ex = EXERCISES_BY_ID.get(pr.exerciseId)
              return <ListRow key={pr.id} leading={<PRBadge />} title={ex?.name} subtitle={describePR(pr, units, ex?.timed)} trailing={<span className="text-[13px]">{formatDate(pr.date)}</span>} />
            })}
          </ListGroup>
        )}
      </section>
      <Card className="bg-surface-2">
        <p className="text-sm text-muted">Charts for strength, running, consistency and body weight are coming in a later update.</p>
      </Card>
    </Screen>
  )
}
