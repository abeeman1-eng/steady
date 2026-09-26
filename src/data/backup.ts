import { db, migrateProfileToV2, TABLE_NAMES, type TableName } from './db'
import { PROFILE_ID, updateProfile } from './repositories/profileRepo'

// 2: profile.goals replaced profile.mainGoal. Older backups are upgraded on import.
export const BACKUP_FORMAT_VERSION = 2

export interface BackupFile {
  app: 'steady'
  formatVersion: number
  exportedAt: string
  tables: Partial<Record<TableName, unknown[]>>
}

export async function exportAll(): Promise<BackupFile> {
  const tables: BackupFile['tables'] = {}
  await db.transaction('r', TABLE_NAMES.map((t) => db.table(t)), async () => {
    for (const name of TABLE_NAMES) tables[name] = await db.table(name).toArray()
  })
  return { app: 'steady', formatVersion: BACKUP_FORMAT_VERSION, exportedAt: new Date().toISOString(), tables }
}

/** Build the backup file, hand it to the browser as a download and record the backup date. */
export async function downloadBackup(): Promise<void> {
  const backup = await exportAll()
  const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `steady-backup-${backup.exportedAt.slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
  await updateProfile({ lastBackupAt: backup.exportedAt, backupReminderSnoozedUntil: undefined })
}

export class BackupError extends Error {}

export function parseBackup(text: string): BackupFile {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new BackupError('That file is not a Steady backup (it is not valid JSON).')
  }
  const file = data as Partial<BackupFile>
  if (!file || file.app !== 'steady' || typeof file.tables !== 'object' || file.tables === null) {
    throw new BackupError('That file is not a Steady backup.')
  }
  if (typeof file.formatVersion !== 'number' || file.formatVersion > BACKUP_FORMAT_VERSION) {
    throw new BackupError('This backup was made by a newer version of Steady. Update the app and try again.')
  }
  for (const [name, rows] of Object.entries(file.tables)) {
    if (!(TABLE_NAMES as readonly string[]).includes(name) || !Array.isArray(rows)) {
      throw new BackupError(`The backup has an unexpected section: ${name}.`)
    }
  }
  return file as BackupFile
}

/** Replace everything on this device with the backup's contents, all or nothing. */
export async function importBackup(backup: BackupFile): Promise<void> {
  await db.transaction('rw', TABLE_NAMES.map((t) => db.table(t)), async () => {
    for (const name of TABLE_NAMES) {
      await db.table(name).clear()
      const rows = backup.tables[name]
      if (name === 'profile') rows?.forEach((r) => migrateProfileToV2(r as Record<string, unknown>))
      if (rows?.length) await db.table(name).bulkAdd(rows)
    }
    // The data on this device is now backed up as of the export.
    await db.profile.update(PROFILE_ID, { lastBackupAt: backup.exportedAt })
  })
}

/** Ask the browser not to evict our data under storage pressure. */
export async function requestPersistentStorage(): Promise<boolean | undefined> {
  if (!navigator.storage?.persist) return undefined
  try {
    if (await navigator.storage.persisted()) return true
    return await navigator.storage.persist()
  } catch {
    return undefined
  }
}
