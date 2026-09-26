import { useLiveQuery } from 'dexie-react-hooks'
import { Card, PRBadge, Screen, SectionTitle } from '../../components/ui'
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
        <ul className="flex flex-col gap-2">
          {prs?.map((pr) => {
            const ex = EXERCISES_BY_ID.get(pr.exerciseId)
            return (
              <li key={pr.id} className="rounded-2xl border border-border bg-surface p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 font-semibold">
                    <PRBadge />
                    {ex?.name}
                  </span>
                  <span className="shrink-0 text-sm text-muted">{formatDate(pr.date)}</span>
                </div>
                <p className="mt-1 text-muted">{describePR(pr, units, ex?.timed)}</p>
              </li>
            )
          })}
        </ul>
      </section>
      <Card className="bg-surface-2">
        <p className="text-sm text-muted">Charts for strength, running, consistency and body weight are coming in a later update.</p>
      </Card>
    </Screen>
  )
}
