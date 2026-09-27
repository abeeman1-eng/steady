import { useLiveQuery } from 'dexie-react-hooks'
import { type ReactNode, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, ButtonLink, Card, Chevron, PRBadge, Ring, Section } from '../../components/ui'
import { downloadBackup } from '../../data/backup'
import { getEntriesForDate } from '../../data/repositories/mealRepo'
import { ensurePlannedSessions, getNextPlanned, getPlannedBetween, getPlannedForDate } from '../../data/repositories/planRepo'
import { updateProfile } from '../../data/repositories/profileRepo'
import { getMostRecentPR } from '../../data/repositories/recordsRepo'
import { getInProgressWorkout, listCompletedBetween, startFreeWorkout, startPlannedWorkout } from '../../data/repositories/workoutRepo'
import { needsBackupReminder } from '../../domain/backupReminder'
import { addDays, formatDate, startOfWeek, todayISO } from '../../domain/dates'
import { EXERCISES_BY_ID } from '../../domain/exerciseLibrary'
import { formatCalories, mealForTime, scaleNutrition, sumNutrition } from '../../domain/nutrition'
import { describePR, formatSetTarget } from '../../lib/format'
import { useNutritionTargets } from '../../lib/useNutritionTargets'
import { useProfile } from '../../lib/profileContext'
import { MacroLine } from '../meals/NutritionUi'
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
    <main className="mx-auto w-full max-w-xl px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-32">
      <header className="mb-6">
        <p className="mb-1 text-[13px] font-medium text-muted">{formatDate(today, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        <h1 className="text-[28px] leading-tight font-semibold">{greeting}</h1>
      </header>

      <div className="flex flex-col gap-6">
        {needsBackupReminder(profile) && <BackupReminder />}

        {loading ? (
          <Card className="h-48 animate-pulse" />
        ) : inProgress ? (
          <HeroCard eyebrow="In progress" accent title={inProgress.name}>
            <Button block className="mt-5" onClick={() => navigate(`/session/${inProgress.id}`)}>
              Resume workout
            </Button>
          </HeroCard>
        ) : doneToday.length > 0 ? (
          <HeroCard eyebrow="Done for today" accent title={doneToday.map((w) => w.name).join(', ')}>
            <p className="mt-1 text-[15px] text-muted">Nice work. Rest up.</p>
            <Button variant="secondary" className="mt-5" onClick={() => start(startFreeWorkout)} disabled={starting}>
              Log another workout
            </Button>
          </HeroCard>
        ) : planned ? (
          <HeroCard eyebrow={`Today’s session${planned.optional ? ' · optional' : ''}`} title={planned.name}>
            {planned.targets.kind === 'strength' ? (
              <ol className="mt-4 flex flex-col">
                {planned.targets.exercises.map((t, i) => {
                  const ex = EXERCISES_BY_ID.get(t.exerciseId)
                  return (
                    <li key={t.exerciseId} className="flex items-center gap-3 border-t border-border py-2.5 first:border-t-0">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-3 text-[12px] font-semibold text-muted">{i + 1}</span>
                      <span className="min-w-0 flex-1 truncate text-[15px]">{ex?.name}</span>
                      <span className="shrink-0 text-[13px] text-muted tabular-nums">{formatSetTarget(t.sets, t.repMin, t.repMax, ex?.timed)}</span>
                    </li>
                  )
                })}
              </ol>
            ) : (
              <p className="mt-2 text-[15px] text-muted">
                {planned.targets.durationMin} min · {planned.targets.activity}. {planned.targets.cue}.
              </p>
            )}
            <Button block className="mt-5" onClick={() => start(() => startPlannedWorkout(planned.id))} disabled={starting}>
              Start workout
            </Button>
          </HeroCard>
        ) : (
          <HeroCard eyebrow="Rest day" title="Recovery is part of the plan">
            {nextPlanned && (
              <p className="mt-2 text-[15px] text-muted">
                Next up: <span className="font-medium text-text">{nextPlanned.name}</span>{' '}
                {nextPlanned.date === addDays(today, 1) ? 'tomorrow' : `on ${formatDate(nextPlanned.date, { weekday: 'long' })}`}
              </p>
            )}
            <Button variant="secondary" className="mt-5" onClick={() => start(startFreeWorkout)} disabled={starting}>
              Log a workout anyway
            </Button>
          </HeroCard>
        )}

        <Section title="This week">
          <Card>
            <WeekDots weekStart={weekStart} today={today} planned={weekPlanned ?? []} done={weekDone ?? []} />
          </Card>
        </Section>

        {profile.showMeals !== false && <FoodTodayCard today={today} />}

        {recentPR && (
          <Section title="Latest PR">
            <Link to="/progress" className="flex items-center gap-4 rounded-[20px] bg-surface p-5 ring-1 ring-border ring-inset transition hover:bg-surface-2">
              <PRBadge />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-medium">{EXERCISES_BY_ID.get(recentPR.exerciseId)?.name}</span>
                <span className="mt-0.5 block truncate text-[13px] text-muted">
                  {describePR(recentPR, profile.units, EXERCISES_BY_ID.get(recentPR.exerciseId)?.timed)} · {formatDate(recentPR.date)}
                </span>
              </span>
              <Chevron />
            </Link>
          </Section>
        )}
      </div>
    </main>
  )
}

function HeroCard({ eyebrow, title, accent, children }: { eyebrow: string; title: string; accent?: boolean; children: ReactNode }) {
  return (
    <section className={`relative overflow-hidden rounded-[24px] p-5 ring-1 ring-inset ${accent ? 'bg-accent-soft ring-accent/30' : 'bg-surface ring-border'}`}>
      <p className={`text-[12px] font-semibold tracking-[0.06em] uppercase ${accent ? 'text-accent' : 'text-muted'}`}>{eyebrow}</p>
      <h2 className="mt-1.5 text-[22px] leading-snug font-semibold">{title}</h2>
      {children}
    </section>
  )
}

function BackupReminder() {
  const [busy, setBusy] = useState(false)
  return (
    <Card className="bg-surface-2">
      <p className="text-[15px] font-medium">It’s been a while since your last backup</p>
      <p className="mt-1 text-[14px] text-muted">Your data lives only in this browser. Save a copy so nothing gets lost.</p>
      <div className="mt-4 flex flex-wrap gap-2">
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

function FoodTodayCard({ today }: { today: string }) {
  const { targets } = useNutritionTargets()
  const entries = useLiveQuery(() => getEntriesForDate(today), [today])
  if (!entries) return null
  const totals = sumNutrition(entries.map((e) => scaleNutrition(e, e.servings)))
  const cal = targets?.calories
  return (
    <Section title="Food today" action={<Link to="/meals" className="inline-flex min-h-11 items-center text-[13px] font-medium text-accent">View log</Link>}>
      <Card>
        <div className="flex items-center gap-5">
          <Ring value={totals.calories} target={cal} size={96} stroke={8} label={cal ? `${Math.round(totals.calories)} of ${cal} calories` : `${Math.round(totals.calories)} calories`}>
            <span className="text-[20px] leading-none font-semibold tabular-nums">{formatCalories(totals.calories)}</span>
            <span className="mt-1 text-[11px] text-muted">{cal ? `of ${formatCalories(cal)}` : 'cal'}</span>
          </Ring>
          <div className="min-w-0 flex-1">
            <p className="text-[15px]">
              {cal ? (
                totals.calories <= cal ? (
                  <>
                    <span className="font-semibold tabular-nums">{formatCalories(cal - totals.calories)}</span> <span className="text-muted">calories left</span>
                  </>
                ) : (
                  <>
                    <span className="font-semibold tabular-nums">{formatCalories(totals.calories - cal)}</span> <span className="text-muted">over target</span>
                  </>
                )
              ) : (
                <span className="text-muted">{entries.length ? `${entries.length} ${entries.length === 1 ? 'item' : 'items'} logged` : 'Nothing logged yet'}</span>
              )}
            </p>
            <MacroLine n={totals} className="mt-2" />
          </div>
        </div>
        <ButtonLink to={`/meals/add?meal=${mealForTime()}`} className="mt-5 w-full">
          Log food
        </ButtonLink>
      </Card>
    </Section>
  )
}
