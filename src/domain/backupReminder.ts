const DAY_MS = 86_400_000
export const BACKUP_REMINDER_DAYS = 30

/**
 * True when it has been 30+ days since the last export (or since onboarding if the user has
 * never exported) and the reminder is not snoozed.
 */
export function needsBackupReminder(
  p: { lastBackupAt?: string; onboardedAt?: string; backupReminderSnoozedUntil?: string },
  now = new Date(),
): boolean {
  const since = p.lastBackupAt ?? p.onboardedAt
  if (!since) return false
  if (p.backupReminderSnoozedUntil && new Date(p.backupReminderSnoozedUntil) > now) return false
  return now.getTime() - new Date(since).getTime() >= BACKUP_REMINDER_DAYS * DAY_MS
}
