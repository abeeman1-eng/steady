import { db } from '../db'
import { stamp, touch } from '../records'

/** One body-weight entry per day; logging again the same day replaces it. */
export async function addBodyWeight(date: string, weightKg: number): Promise<void> {
  const existing = await db.bodyMetrics.where('date').equals(date).first()
  if (existing) await db.bodyMetrics.update(existing.id, touch({ weightKg }))
  else await db.bodyMetrics.add(stamp({ date, weightKg }))
}

export async function getLatestBodyWeight() {
  return (await db.bodyMetrics.orderBy('date').last()) ?? null
}
