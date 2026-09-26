import { db } from '../db'
import type { PersonalRecordRecord } from '../schema'

export async function listPersonalRecords(): Promise<PersonalRecordRecord[]> {
  const all = await db.personalRecords.toArray()
  return all.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
}

export async function getMostRecentPR(sinceDate: string): Promise<PersonalRecordRecord | null> {
  const recent = await db.personalRecords.where('date').aboveOrEqual(sinceDate).toArray()
  recent.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
  return recent[0] ?? null
}
