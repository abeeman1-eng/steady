import type { BaseRecord } from './schema'

/** Fixed until accounts exist; a sync migration will rewrite it to the real user id. */
export const LOCAL_USER_ID = 'local'

export const newId = () => crypto.randomUUID()

const nowIso = () => new Date().toISOString()

/** Add id, timestamps and userId to a new record. */
export function stamp<T extends object>(fields: T, id: string = newId()): T & BaseRecord {
  const now = nowIso()
  return { ...fields, id, createdAt: now, updatedAt: now, userId: LOCAL_USER_ID }
}

/** Fields to merge into an update so updatedAt stays current. */
export function touch<T extends object>(changes: T): T & { updatedAt: string } {
  return { ...changes, updatedAt: nowIso() }
}
