import { useEffect, useState, useSyncExternalStore } from 'react'
import { remainingSec, restTimer } from '../../lib/restTimer'

/** Re-render about four times a second while `active`, so the countdown moves. */
export function useNow(active: boolean): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!active) return
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [active])
  return now
}

/** The app's rest timer as seen from one workout (see src/lib/restTimer.ts). */
export function useRestTimer(workoutId: string) {
  const { timer, finished } = useSyncExternalStore(restTimer.subscribe, restTimer.getSnapshot)
  const mine = timer?.workoutId === workoutId ? timer : null
  const now = useNow(!!mine)
  return {
    active: !!mine,
    justFinished: finished?.workoutId === workoutId,
    remainingSec: mine ? remainingSec(mine, now) : 0,
    totalSec: mine?.totalSec ?? 0,
    start: (sec: number) => restTimer.start(workoutId, sec),
    adjust: (deltaSec: number) => restTimer.adjust(deltaSec),
    skip: () => restTimer.skip(),
  }
}
