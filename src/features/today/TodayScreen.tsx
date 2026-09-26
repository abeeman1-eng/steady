import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Card, PRBadge, SectionTitle } from '../../components/ui'
import { downloadBackup } from '../../data/backup'
import { ensurePlannedSessions, getNextPlanned, getPlannedBetween, getPlannedForDate } from '../../data/repositories/planRepo'
import { updateProfile } from '../../data/repositories/profileRepo'
import { getEntriesForDate } from '../../data/repositories/mealRepo'
import { getMostRecentPR } from '../../data/repositories/recordsRepo'
import { getInProgressWorkout, listCompletedBetween, startFreeWorkout, startPlannedWorkout } from '../../data/repositories/workoutRepo'
import { needsBackupReminder } from '../../domain/backupReminder'
import { addDays, formatDate, startOfWeek, todayISO } from '../../domain/dates'
import { EXERCISES_BY_ID } from '../../domain/exerciseLibrary'
import { formatCalories, mealForTime, scaleNutrition, sumNutrition } from '../../domain/nutrition'
import { describePR, formatSetTarget } from '../../lib/format'
import { useProfile } from '../../lib/profileContext'
import { WeekDots } from './WeekDots'

export function TodayScreen() {
  const profile = useProfile()
  const navigate = useNavigate()
  const today = todayISO()
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    void ensurePlannedSessions()
  }, [])

  const inProgress = useLiveQuery(getInProgressWorkout)
  const planned = useLiveQuery(() => getPlannedForDate(today), [today])
  const doneToday = useLiveQuery(() => listCompletedBetween(today, today), [today])
  const weekStart = startOfWeek(today)
  const weekPlanned = useLiveQuery(() => getPlannedBetween(weekStart, addDays(weekStart, 6)), [weekStart])
  const weekDone = useLiveQuery(() => listCompletedBetween(weekStart, addDays(weekStart, 6)), [weekStart])
  const nextPlanned = useLiveQuery(() => getNextPlanned(today), [today])
  const recentPR = useLiveQuery(() => getMostRecentPR(addDays(today, -14)), [today])

  async function start(fn: () => Promise<string>) {
    setStarting(true)
    try {
      navigate(`/session/${await fn()}`)
    } finally {
      setStarting(false)
    }
  }

  const loading = inProgress === undefined || planned === undefined || doneToday === undefined
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <main className="mx-auto w-full max-w-xl px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-28">
      <header className="mb-4">
        <p className="text-sm text-muted">{formatDate(today, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        <h1 className="text-2xl font-bold">{greeting}</h1>
      </header>

      <div className="flex flex-col gap-4">
        {needsBackupReminder(profile) && <BackupReminder />}

        {loading ? (
          <Card className="h-40 animate-pulse" />
        ) : inProgress ? (
          <Card className="border-accent">
            <p className="text-sm text-accent">In progress</p>
            <h2 className="text-xl font-semibold">{inProgress.name}</h2>
            <Button block className="mt-3" onClick={() => navigate(`/session/${inProgress.id}`)}>
              Resume
            </Button>
          </Card>
        ) : doneToday.length > 0 ? (
          <Card>
            <p className="text-sm text-accent">Done for today</p>
            <h2 className="text-xl font-semibold">{doneToday.map((w) => w.name).join(', ')}</h2>
            <p className="mt-1 text-muted">Nice work. Rest up.</p>
            <Button variant="ghost" className="mt-2 -ml-4" onClick={() => start(startFreeWorkout)} disabled={starting}>
              Log another workout
            </Button>
          </Card>
        ) : planned ? (
          <Card>
            <p className="text-sm text-muted">Today{planned.optional ? ' · optional' : ''}</p>
            <h2 className="text-xl font-semibold">{planned.name}</h2>
            {planned.targets.kind === 'strength' ? (
              <ul className="mt-3 flex flex-col gap-1">
                {planned.targets.exercises.map((t) => {
                  const ex = EXERCISES_BY_ID.get(t.exerciseId)
                  return (
                    <li key={t.exerciseId} className="flex justify-between gap-2">
                      <span>{ex?.name}</span>
                      <span className="shrink-0 text-muted">{formatSetTarget(t.sets, t.repMin, t.repMax, ex?.timed)}</span>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="mt-2 text-muted">
                {planned.targets.durationMin} min · {planned.targets.activity}. {planned.targets.cue}.
              </p>
            )}
            <Button block className="mt-4" onClick={() => start(() => startPlannedWorkout(planned.id))} disabled={starting}>
              Start
            </Button>
          </Card>
        ) : (
          <Card>
            <h2 className="text-xl font-semibold">Rest day</h2>
            <p className="mt-1 text-muted">Recovery is part of the plan.</p>
            {nextPlanned && (
              <p className="mt-3">
                Next up: <span className="font-semibold">{nextPlanned.name}</span>{' '}
                <span className="text-muted">
                  {nextPlanned.date === addDays(today, 1) ? 'tomorrow' : `on ${formatDate(nextPlanned.date, { weekday: 'long' })}`}
                </span>
              </p>
            )}
            <Button variant="ghost" className="mt-2 -ml-4" onClick={() => start(startFreeWorkout)} disabled={starting}>
              Log a workout anyway
            </Button>
          </Card>
        )}

        <section className="flex flex-col gap-2">
          <SectionTitle>This week</SectionTitle>
          <Card>
            <WeekDots weekStart={weekStart} today={today} planned={weekPlanned ?? []} done={weekDone ?? []} />
          </Card>
        </section>

        {recentPR && (
          <section className="flex flex-col gap-2">
            <SectionTitle>Latest PR</SectionTitle>
            <Link to="/progress" className="rounded-2xl border border-border bg-surface p-4 hover:bg-surface-2">
              <div className="flex items-center gap-2">
                <PRBadge />
                <span className="font-semibold">{EXERCISES_BY_ID.get(recentPR.exerciseId)?.name}</span>
              </div>
              <p className="mt-1 text-muted">
                {describePR(recentPR, profile.units, EXERCISES_BY_ID.get(recentPR.exerciseId)?.timed)} · {formatDate(recentPR.date)}
              </p>
            </Link>
          </section>
        )}

        {profile.showMeals !== false && <FoodTodayCard today={today} />}
      </div>
    </main>
  )
}

function FoodTodayCard({ today }: { today: string }) {
  const { nutritionTargets: targets } = useProfile()
  const entries = useLiveQuery(() => getEntriesForDate(today), [today])
  if (!entries) return null
  const totals = sumNutrition(entries.map((e) => scaleNutrition(e, e.servings)))
  return (
    <section className="flex flex-col gap-2">
      <SectionTitle>Food today</SectionTitle>
      <Card>
        <dl className="grid grid-cols-2 gap-3">
          <div>
            <dt className="text-sm text-muted">Calories</dt>
            <dd className="text-2xl font-bold tabular-nums">
              {formatCalories(totals.calories)}
              {targets?.calories ? <span className="text-base font-normal text-muted"> / {formatCalories(targets.calories)}</span> : null}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted">Protein</dt>
            <dd className="text-2xl font-bold tabular-nums">
              {Math.round(totals.proteinG)}
              {targets?.proteinG ? <span className="text-base font-normal text-muted"> / {Math.round(targets.proteinG)}</span> : null}
              <span className="text-base font-normal text-muted"> g</span>
            </dd>
          </div>
        </dl>
        <div className="mt-3 flex gap-2">
          <Link to={`/meals/add?meal=${mealForTime()}`} className="flex min-h-11 flex-1 items-center justify-center rounded-xl bg-accent px-4 font-semibold text-accent-ink hover:brightness-110">
            Log food
          </Link>
          <Link to="/meals" className="flex min-h-11 items-center justify-center rounded-xl border border-border bg-surface-2 px-4 hover:bg-border">
            View day
          </Link>
        </div>
      </Card>
    </section>
  )
}

function BackupReminder() {
  const [busy, setBusy] = useState(false)
  return (
    <Card className="bg-surface-2">
      <p className="font-medium">It’s been a while since your last backup</p>
      <p className="mt-1 text-sm text-muted">Your data lives only in this browser. Save a copy so nothing gets lost.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          disabled={busy}
          onClick={async () => {
            setBusy(true)
            await downloadBackup().finally(() => setBusy(false))
          }}
        >
          Export now
        </Button>
        <Button variant="ghost" onClick={() => updateProfile({ backupReminderSnoozedUntil: new Date(Date.now() + 7 * 86_400_000).toISOString() })}>
          Remind me later
        </Button>
      </div>
    </Card>
  )
}
