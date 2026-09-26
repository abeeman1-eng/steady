import { addDays, todayISO, weekdayOf } from '../../domain/dates'
import type { GeneratedPlan } from '../../domain/types'
import { db } from '../db'
import { stamp, touch } from '../records'
import type { PlanRecord, PlannedSessionRecord } from '../schema'

/** How far ahead planned sessions are created. */
const LOOKAHEAD_DAYS = 13

export async function getActivePlan(): Promise<PlanRecord | null> {
  return (await db.plans.where('status').equals('active').first()) ?? null
}

/**
 * Make `generated` the active plan from `startDate`. Past sessions and anything already done
 * stay in history; upcoming sessions from the old plan are removed.
 */
export async function activatePlan(generated: GeneratedPlan, startDate = todayISO()): Promise<PlanRecord> {
  const plan: PlanRecord = stamp({
    type: generated.type,
    status: 'active' as const,
    startDate,
    summary: generated.summary,
    weekly: generated.weekly,
  })
  await db.transaction('rw', db.plans, db.plannedSessions, async () => {
    const old = await db.plans.where('status').equals('active').toArray()
    for (const p of old) {
      await db.plans.update(p.id, touch({ status: 'archived' as const }))
      await db.plannedSessions
        .where('planId')
        .equals(p.id)
        .filter((s) => s.date >= startDate && s.status === 'planned')
        .delete()
    }
    await db.plans.add(plan)
  })
  await ensurePlannedSessions()
  return plan
}

/** Create planned sessions for the active plan up to `through` (default: two weeks ahead). */
export async function ensurePlannedSessions(through = addDays(todayISO(), LOOKAHEAD_DAYS)): Promise<void> {
  await db.transaction('rw', db.plans, db.plannedSessions, async () => {
    const plan = await db.plans.where('status').equals('active').first()
    if (!plan) return
    let date = plan.generatedThrough ? addDays(plan.generatedThrough, 1) : plan.startDate
    if (date > through) return
    // Days already trained under a previous plan don't get a second session.
    const doneDates = new Set(
      (await db.plannedSessions.where('date').between(date, through, true, true).toArray()).filter((s) => s.status === 'done').map((s) => s.date),
    )
    const toAdd: PlannedSessionRecord[] = []
    for (; date <= through; date = addDays(date, 1)) {
      if (doneDates.has(date)) continue
      for (const t of plan.weekly.filter((w) => w.weekday === weekdayOf(date))) {
        toAdd.push(
          stamp({
            planId: plan.id,
            date,
            name: t.name,
            type: t.type,
            optional: t.optional,
            targets: t.targets,
            status: 'planned' as const,
          }),
        )
      }
    }
    await db.plannedSessions.bulkAdd(toAdd)
    await db.plans.update(plan.id, touch({ generatedThrough: through }))
  })
}

export async function getPlannedForDate(date: string): Promise<PlannedSessionRecord | null> {
  const plan = await getActivePlan()
  if (!plan) return null
  return (await db.plannedSessions.where('[planId+date]').equals([plan.id, date]).first()) ?? null
}

export async function getPlannedBetween(from: string, to: string): Promise<PlannedSessionRecord[]> {
  const plan = await getActivePlan()
  if (!plan) return []
  return db.plannedSessions.where('[planId+date]').between([plan.id, from], [plan.id, to], true, true).toArray()
}

/** The first not-yet-done session after `date`, e.g. "Next up: Full body A on Monday". */
export async function getNextPlanned(date: string): Promise<PlannedSessionRecord | null> {
  const plan = await getActivePlan()
  if (!plan) return null
  const upcoming = await db.plannedSessions
    .where('[planId+date]')
    .between([plan.id, addDays(date, 1)], [plan.id, '9999-12-31'], true, true)
    .filter((s) => s.status === 'planned')
    .first()
  return upcoming ?? null
}

export const getPlannedSession =(id: string) => db.plannedSessions.get(id)
