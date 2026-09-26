import { useCallback, useEffect, useRef, useState } from 'react'
import { playChime, vibrate } from '../../lib/alerts'

interface TimerState {
  endsAt: number
  totalSec: number
}

const storageKey = (workoutId: string) => `steady:rest:${workoutId}`

function load(workoutId: string): TimerState | null {
  try {
    const raw = sessionStorage.getItem(storageKey(workoutId))
    const t = raw ? (JSON.parse(raw) as TimerState) : null
    return t && t.endsAt > Date.now() ? t : null
  } catch {
    return null
  }
}

function save(workoutId: string, t: TimerState | null) {
  try {
    if (t) sessionStorage.setItem(storageKey(workoutId), JSON.stringify(t))
    else sessionStorage.removeItem(storageKey(workoutId))
  } catch {
    // Storage unavailable (private mode); the timer still works for this page view.
  }
}

/**
 * Rest countdown based on an end timestamp, so it stays accurate if the phone locks or the tab
 * is backgrounded. Plays the chime and vibrates once when it reaches zero, if alerts are on.
 */
export function useRestTimer(workoutId: string, alerts: boolean) {
  const [timer, setTimer] = useState<TimerState | null>(() => load(workoutId))
  const [now, setNow] = useState(() => Date.now())
  const [justFinished, setJustFinished] = useState(false)
  const alertsRef = useRef(alerts)
  useEffect(() => {
    alertsRef.current = alerts
  }, [alerts])

  const update = useCallback(
    (t: TimerState | null) => {
      setTimer(t)
      save(workoutId, t)
    },
    [workoutId],
  )

  useEffect(() => {
    if (!timer) return
    const id = setInterval(() => {
      const n = Date.now()
      setNow(n)
      if (n >= timer.endsAt) {
        clearInterval(id)
        update(null)
        setJustFinished(true)
        if (alertsRef.current) {
          playChime()
          vibrate([200, 100, 200])
        }
      }
    }, 250)
    return () => clearInterval(id)
  }, [timer, update])

  useEffect(() => {
    if (!justFinished) return
    const id = setTimeout(() => setJustFinished(false), 4000)
    return () => clearTimeout(id)
  }, [justFinished])

  return {
    active: !!timer,
    justFinished,
    remainingSec: timer ? Math.max(0, Math.ceil((timer.endsAt - now) / 1000)) : 0,
    totalSec: timer?.totalSec ?? 0,
    start: (sec: number) => {
      setJustFinished(false)
      setNow(Date.now())
      update({ endsAt: Date.now() + sec * 1000, totalSec: sec })
    },
    adjust: (deltaSec: number) => {
      if (!timer) return
      const endsAt = Math.max(Date.now() + 1000, timer.endsAt + deltaSec * 1000)
      update({ endsAt, totalSec: Math.max(1, timer.totalSec + deltaSec) })
    },
    skip: () => update(null),
  }
}
