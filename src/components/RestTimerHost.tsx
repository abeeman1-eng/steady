import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useSyncExternalStore } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { getInProgressWorkout } from '../data/repositories/workoutRepo'
import { useNow } from '../features/session/useRestTimer'
import { playChime, vibrate } from '../lib/alerts'
import { formatDuration } from '../lib/format'
import { useProfile } from '../lib/profileContext'
import { REST_TIMER_KEY, remainingSec, restTimer } from '../lib/restTimer'

/**
 * Mounted once for the whole app. Ticks the rest timer and plays the chime on whatever screen
 * is open, and drops a timer whose workout was finished or discarded.
 */
export function RestTimerHost() {
  const { restTimerAlerts } = useProfile()
  const { timer, finished } = useSyncExternalStore(restTimer.subscribe, restTimer.getSnapshot)
  const inProgress = useLiveQuery(getInProgressWorkout)

  useEffect(() => {
    // undefined means still loading; only clear once we know.
    if (inProgress !== undefined) restTimer.clearUnless(inProgress?.id ?? null)
  }, [inProgress, timer?.workoutId])

  useEffect(() => {
    if (!timer && !finished) return
    const id = setInterval(() => {
      if (restTimer.tick() && restTimerAlerts) {
        playChime()
        vibrate([200, 100, 200])
      }
    }, 250)
    return () => clearInterval(id)
  }, [timer, finished, restTimerAlerts])

  useEffect(() => {
    const onStorage = (e: StorageEvent) => e.key === REST_TIMER_KEY && restTimer.reload()
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  return null
}

/**
 * A slim rest bar above the tab bar while you're away from the workout (logging food, checking
 * an exercise), so rest isn't lost or missed. Tapping it goes back to the workout.
 */
export function RestTimerBanner() {
  const { timer, finished } = useSyncExternalStore(restTimer.subscribe, restTimer.getSnapshot)
  const path = useLocation().pathname
  const now = useNow(!!timer)
  const workoutId = timer?.workoutId ?? finished?.workoutId
  if (!workoutId || path.startsWith(`/session/${workoutId}`)) return null
  const left = timer ? remainingSec(timer, now) : 0
  const pct = timer ? (left / timer.totalSec) * 100 : 0

  return (
    <div className="fixed inset-x-0 bottom-[calc(59px+env(safe-area-inset-bottom))] z-20 border-t border-border bg-surface print:hidden">
      <div className="h-1 bg-surface-2">
        <div className="h-full bg-accent transition-[width] duration-300" style={{ width: `${pct}%` }} />
      </div>
      <Link to={`/session/${workoutId}`} className="mx-auto flex min-h-11 max-w-xl items-center gap-3 px-4 py-1.5" role="timer">
        {timer ? (
          <>
            <span className="text-[13px] text-muted">Rest</span>
            <span className="text-lg font-semibold tabular-nums">{formatDuration(left)}</span>
          </>
        ) : (
          <span className="font-semibold text-accent" aria-live="polite">
            Rest done: time for your next set
          </span>
        )}
        <span className="ml-auto text-[14px] font-medium text-accent">Back to workout ›</span>
      </Link>
    </div>
  )
}
