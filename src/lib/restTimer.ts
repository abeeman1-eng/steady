/**
 * The rest timer, shared by the whole app. It belongs to one in-progress workout and is saved in
 * localStorage, so it survives a refresh, moving between screens and the app being closed and
 * reopened. It stores an end time rather than a count, so it stays accurate while the phone is
 * locked. `RestTimerHost` (mounted once in the app) ticks it and plays the chime on any screen.
 */

export interface RestTimerState {
  workoutId: string
  endsAt: number
  totalSec: number
}

export interface RestTimerSnapshot {
  timer: RestTimerState | null
  /** The workout whose rest just ended, and when (for a few seconds of "Rest done"). */
  finished: { workoutId: string; at: number } | null
}

interface KeyValueStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export const REST_TIMER_KEY = 'steady:rest'
/** How long "Rest done" shows after the countdown ends. */
export const FINISHED_SHOW_MS = 4000
/** A timer that ran out while the app was closed ends quietly, without a late chime. */
const LATE_CHIME_MS = 2000

export function createRestTimerStore(getStorage: () => KeyValueStorage | undefined, now: () => number = Date.now) {
  const listeners = new Set<() => void>()

  function read(): RestTimerState | null {
    try {
      const raw = getStorage()?.getItem(REST_TIMER_KEY)
      const t = raw ? (JSON.parse(raw) as Partial<RestTimerState>) : null
      return t && typeof t.workoutId === 'string' && typeof t.endsAt === 'number' && typeof t.totalSec === 'number' ? (t as RestTimerState) : null
    } catch {
      return null
    }
  }

  function write(t: RestTimerState | null) {
    try {
      const storage = getStorage()
      if (t) storage?.setItem(REST_TIMER_KEY, JSON.stringify(t))
      else storage?.removeItem(REST_TIMER_KEY)
    } catch {
      // Storage unavailable (private mode): the timer still works until the page closes.
    }
  }

  let snapshot: RestTimerSnapshot = { timer: read(), finished: null }

  function set(next: RestTimerSnapshot, persist = true) {
    snapshot = next
    if (persist) write(next.timer)
    listeners.forEach((l) => l())
  }

  return {
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    getSnapshot: () => snapshot,

    start(workoutId: string, sec: number) {
      set({ timer: { workoutId, endsAt: now() + sec * 1000, totalSec: sec }, finished: null })
    },
    adjust(deltaSec: number) {
      const t = snapshot.timer
      if (!t) return
      set({ ...snapshot, timer: { ...t, endsAt: Math.max(now() + 1000, t.endsAt + deltaSec * 1000), totalSec: Math.max(1, t.totalSec + deltaSec) } })
    },
    skip() {
      if (snapshot.timer) set({ timer: null, finished: null })
    },
    /** Drop the timer if it belongs to a workout that's no longer in progress (finished or discarded). */
    clearUnless(inProgressWorkoutId: string | null) {
      if (snapshot.timer && snapshot.timer.workoutId !== inProgressWorkoutId) set({ timer: null, finished: null })
    },
    /**
     * Called by the host every tick. Ends a timer whose time is up and returns true when the
     * chime should play (not for one that ran out long ago, e.g. while the app was closed).
     */
    tick(): boolean {
      const t = snapshot.timer
      const n = now()
      if (snapshot.finished && n - snapshot.finished.at > FINISHED_SHOW_MS) set({ ...snapshot, finished: null }, false)
      if (!t || n < t.endsAt) return false
      const onTime = n - t.endsAt <= LATE_CHIME_MS
      set({ timer: null, finished: onTime ? { workoutId: t.workoutId, at: n } : null })
      return onTime
    },
    /** Another tab changed the timer. */
    reload() {
      set({ timer: read(), finished: snapshot.finished }, false)
    },
  }
}

export const restTimer = createRestTimerStore(() => (typeof localStorage === 'undefined' ? undefined : localStorage))

export const remainingSec = (t: RestTimerState, now = Date.now()) => Math.max(0, Math.ceil((t.endsAt - now) / 1000))
