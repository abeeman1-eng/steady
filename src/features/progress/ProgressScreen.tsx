import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { BarChart, ChartTable, LineChart } from '../../components/charts'
import { Button, Card, CheckIcon, Field, ListGroup, ListRow, PRBadge, Screen, SectionTitle, inputClass } from '../../components/ui'
import { addBodyWeight } from '../../data/repositories/bodyRepo'
import { getAllPlannedBetween } from '../../data/repositories/planRepo'
import { exercisesWithHistory, listAllRuns, listBodyWeights, strengthRows } from '../../data/repositories/progressRepo'
import { listPersonalRecords } from '../../data/repositories/recordsRepo'
import { listCompletedBetween } from '../../data/repositories/workoutRepo'
import { WEEKDAY_SHORT, addDays, formatDate, startOfWeek, todayISO } from '../../domain/dates'
import { EXERCISES_BY_ID } from '../../domain/exerciseLibrary'
import { type DayState, completionRate, consistencyDays, strengthSeries, weeklyRunStats } from '../../domain/progress'
import type { Units } from '../../domain/types'
import { METERS_PER_MILE, distanceUnitLabel, formatPace, fromDisplayWeight, toDisplayDistance, toDisplayWeight, weightUnitLabel } from '../../domain/units'
import { describePR } from '../../lib/format'
import { useProfile } from '../../lib/profileContext'

/** Categorical slots 1 and 2, validated together on the card surface (CVD and contrast). */
const SERIES_1 = 'var(--protein)'
const SERIES_2 = 'var(--carbs)'
const SINGLE = 'var(--accent)'
const CALENDAR_WEEKS = 12

const shortDate = (iso: string) => formatDate(iso, { month: 'short', day: 'numeric' })

export function ProgressScreen() {
  const { units } = useProfile()
  const prs = useLiveQuery(listPersonalRecords)

  return (
    <Screen title="Progress">
      <ConsistencySection />
      <StrengthSection units={units} />
      <RunningSection units={units} />
      <BodyWeightSection units={units} />
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
    </Screen>
  )
}

// ----- Consistency calendar -----

const DAY_LABEL: Record<DayState, string> = { done: 'Completed', missed: 'Missed', planned: 'Planned', rest: 'Rest day' }

function DayCell({ state, today }: { state: DayState; today?: boolean }) {
  return (
    <span
      className={`flex aspect-square w-full items-center justify-center rounded-md ${
        state === 'done' ? 'bg-accent text-accent-ink' : state === 'missed' ? 'bg-surface-3 text-subtle' : state === 'planned' ? 'ring-1 ring-accent/60 ring-inset' : 'bg-surface-2'
      } ${today ? 'outline-2 outline-offset-1 outline-text' : ''}`}
    >
      {state === 'done' && <CheckIcon className="size-3" />}
      {state === 'missed' && <span aria-hidden className="h-0.5 w-2 rounded-full bg-current" />}
    </span>
  )
}

function ConsistencySection() {
  const today = todayISO()
  const from = addDays(startOfWeek(today), -7 * (CALENDAR_WEEKS - 1))
  const to = addDays(startOfWeek(today), 6)
  const data = useLiveQuery(async () => ({ planned: await getAllPlannedBetween(from, to), workouts: await listCompletedBetween(from, to) }), [from, to])
  if (!data) return null
  const days = consistencyDays(data.planned, data.workouts, from, to)
  const past = days.filter((d) => d.date <= today)
  const rate = completionRate(past)
  const done = past.filter((d) => d.state === 'done').length
  const weeks = Array.from({ length: CALENDAR_WEEKS }, (_, w) => days.slice(w * 7, w * 7 + 7))

  return (
    <section className="flex flex-col gap-2">
      <SectionTitle>Consistency</SectionTitle>
      <Card>
        <p className="text-[15px]">
          <span className="font-semibold tabular-nums">{done}</span> <span className="text-muted">workouts in the last {CALENDAR_WEEKS} weeks</span>
          {rate !== undefined && (
            <>
              <span className="text-muted"> · </span>
              <span className="font-semibold tabular-nums">{Math.round(rate * 100)}%</span> <span className="text-muted">of planned sessions done</span>
            </>
          )}
        </p>
        <div className="mx-auto mt-4 grid max-w-[22rem] grid-cols-[2.5rem_repeat(7,minmax(0,1fr))] gap-1" role="table" aria-label={`Training calendar, last ${CALENDAR_WEEKS} weeks`}>
          <span role="columnheader" />
          {[1, 2, 3, 4, 5, 6, 0].map((d) => (
            <span key={d} role="columnheader" className="text-center text-[11px] text-subtle">
              {WEEKDAY_SHORT[d][0]}
            </span>
          ))}
          {weeks.map((week) => (
            <div key={week[0].date} role="row" className="contents">
              <span role="rowheader" className="self-center text-[11px] text-subtle">
                {shortDate(week[0].date).replace(/ /, ' ')}
              </span>
              {week.map((d) => (
                <span key={d.date} role="cell" title={`${formatDate(d.date)}: ${DAY_LABEL[d.state]}`} aria-label={`${formatDate(d.date)}: ${DAY_LABEL[d.state]}`}>
                  <DayCell state={d.state} today={d.date === today} />
                </span>
              ))}
            </div>
          ))}
        </div>
        <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[12px] text-muted">
          {(['done', 'missed', 'planned', 'rest'] as const).map((s) => (
            <li key={s} className="flex items-center gap-1.5">
              <span className="w-4">
                <DayCell state={s} />
              </span>
              {DAY_LABEL[s]}
            </li>
          ))}
        </ul>
      </Card>
    </section>
  )
}

// ----- Strength -----

function StrengthSection({ units }: { units: Units }) {
  const exerciseIds = useLiveQuery(exercisesWithHistory)
  const [picked, setPicked] = useState<string>()
  const exerciseId = picked && exerciseIds?.includes(picked) ? picked : exerciseIds?.[0]
  const rows = useLiveQuery(async () => (exerciseId ? strengthRows(exerciseId) : null), [exerciseId])
  if (!exerciseIds) return null

  const series = rows ? strengthSeries(rows.sets, rows.workouts) : []
  const w = (kg: number) => toDisplayWeight(kg, units)
  const fmt = (v: number) => `${Math.round(v)} ${weightUnitLabel(units)}`
  const rated = series.filter((p) => p.difficulty !== undefined)

  return (
    <section className="flex flex-col gap-2">
      <SectionTitle>Strength</SectionTitle>
      <Card>
        {exerciseIds.length === 0 ? (
          <p className="text-muted">Finish a workout with weights and your progress for each exercise will chart here.</p>
        ) : (
          <>
            <Field label="Exercise">
              <select className={inputClass} value={exerciseId} onChange={(e) => setPicked(e.target.value)}>
                {exerciseIds.map((id) => (
                  <option key={id} value={id}>
                    {EXERCISES_BY_ID.get(id)?.name ?? id}
                  </option>
                ))}
              </select>
            </Field>
            {series.length > 0 && (
              <div className="mt-4">
                <LineChart
                  label={`${EXERCISES_BY_ID.get(exerciseId!)?.name}: estimated 1-rep max and top set over time`}
                  series={[
                    { name: 'Est. 1-rep max', color: SERIES_1, points: series.filter((p) => p.est1RMKg !== null).map((p) => ({ x: p.date, y: w(p.est1RMKg!) })) },
                    { name: 'Top set', color: SERIES_2, points: series.map((p) => ({ x: p.date, y: w(p.topSetKg) })) },
                  ].filter((s) => s.points.length)}
                  formatY={fmt}
                  formatX={shortDate}
                />
                {rated.length > 0 && (
                  <div className="mt-5">
                    <p className="mb-1 text-[13px] text-muted">How hard it felt (1–10)</p>
                    <LineChart label="Workout difficulty over time" series={[{ name: 'Difficulty', color: SINGLE, points: rated.map((p) => ({ x: p.date, y: p.difficulty! })) }]} formatY={(v) => String(v)} formatX={shortDate} height={110} yDomain={[0, 10]} />
                  </div>
                )}
                <ChartTable
                  columns={['Date', 'Est. 1RM', 'Top set', 'Difficulty']}
                  rows={[...series].reverse().map((p) => [shortDate(p.date), p.est1RMKg === null ? '–' : fmt(w(p.est1RMKg)), fmt(w(p.topSetKg)), p.difficulty ?? '–'])}
                />
              </div>
            )}
          </>
        )}
      </Card>
    </section>
  )
}

// ----- Running -----

function RunningSection({ units }: { units: Units }) {
  const runs = useLiveQuery(listAllRuns)
  if (!runs) return null
  const stats = weeklyRunStats(runs, todayISO(), 12)
  const unit = distanceUnitLabel(units)
  const dist = (m: number) => +toDisplayDistance(m, units).toFixed(1)
  const paceUnitSec = (secPerKm: number) => (units === 'imperial' ? secPerKm * (METERS_PER_MILE / 1000) : secPerKm)
  const paced = stats.filter((s) => s.easyPaceSecPerKm !== undefined)

  return (
    <section className="flex flex-col gap-2">
      <SectionTitle>Running</SectionTitle>
      <Card>
        {runs.length === 0 ? (
          <p className="text-muted">Log a run and your weekly distance and easy pace will chart here.</p>
        ) : (
          <>
            <p className="mb-2 text-[13px] text-muted">Distance per week ({unit})</p>
            <BarChart
              label={`Running distance per week for the last 12 weeks, in ${unit}`}
              bars={stats.map((s) => ({ x: s.weekStart, y: dist(s.distanceM), detail: `${s.runs} ${s.runs === 1 ? 'run' : 'runs'}` }))}
              color={SINGLE}
              formatY={(v) => `${v} ${unit}`}
              formatX={shortDate}
                  formatTip={(x) => `Week of ${shortDate(x)}`}
            />
            {paced.length > 0 && (
              <div className="mt-5">
                <p className="mb-1 text-[13px] text-muted">Average easy-run pace (lower is faster)</p>
                <LineChart
                  label="Average easy-run pace by week"
                  series={[{ name: 'Easy pace', color: SINGLE, points: paced.map((s) => ({ x: s.weekStart, y: paceUnitSec(s.easyPaceSecPerKm!) })) }]}
                  formatY={(v) => formatPace(v, units).replace(` /${unit}`, '')}
                  formatX={shortDate}
                  formatTip={(x) => `Week of ${shortDate(x)}`}
                  height={140}
                />
              </div>
            )}
            <ChartTable
              columns={['Week of', `Distance (${unit})`, 'Runs', 'Easy pace']}
              rows={[...stats].reverse().filter((s) => s.runs).map((s) => [shortDate(s.weekStart), dist(s.distanceM), s.runs, s.easyPaceSecPerKm ? formatPace(paceUnitSec(s.easyPaceSecPerKm), units) : '–'])}
            />
          </>
        )}
      </Card>
    </section>
  )
}

// ----- Body weight -----

function BodyWeightSection({ units }: { units: Units }) {
  const entries = useLiveQuery(listBodyWeights)
  const [value, setValue] = useState('')
  const [saved, setSaved] = useState(false)
  if (!entries) return null
  const unit = weightUnitLabel(units)
  const n = parseFloat(value)
  const valid = Number.isFinite(n) && n > (units === 'imperial' ? 50 : 23) && n < (units === 'imperial' ? 900 : 400)

  return (
    <section className="flex flex-col gap-2">
      <SectionTitle>Body weight</SectionTitle>
      <Card>
        {entries.length >= 2 ? (
          <>
            <LineChart
              label={`Body weight over time, in ${unit}`}
              series={[{ name: 'Body weight', color: SINGLE, points: entries.map((e) => ({ x: e.date, y: toDisplayWeight(e.weightKg, units) })) }]}
              formatY={(v) => `${Math.round(v)}`}
              formatX={shortDate}
            />
            <ChartTable columns={['Date', `Weight (${unit})`]} rows={[...entries].reverse().map((e) => [shortDate(e.date), toDisplayWeight(e.weightKg, units)])} />
          </>
        ) : (
          <p className="text-muted">{entries.length === 1 ? `Starting weight: ${toDisplayWeight(entries[0].weightKg, units)} ${unit}. Log another to see a chart.` : 'Optional. Log your weight now and then to see a trend.'}</p>
        )}
        <form
          className="mt-4 flex items-end gap-2"
          onSubmit={async (e) => {
            e.preventDefault()
            if (!valid) return
            await addBodyWeight(todayISO(), fromDisplayWeight(n, units))
            setValue('')
            setSaved(true)
          }}
        >
          <div className="flex-1">
            <Field label={`Today’s weight (${unit})`}>
              <input
                className={inputClass}
                type="number"
                inputMode="decimal"
                value={value}
                onChange={(e) => {
                  setValue(e.target.value)
                  setSaved(false)
                }}
              />
            </Field>
          </div>
          <Button type="submit" disabled={!valid}>
            Log
          </Button>
        </form>
        {saved && (
          <p role="status" className="mt-2 text-[13px] text-accent">
            Saved for today
          </p>
        )}
      </Card>
    </section>
  )
}
