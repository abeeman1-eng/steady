import { formatDuration } from '../../lib/format'
import type { useRestTimer } from './useRestTimer'

export function RestTimerBar({ timer }: { timer: ReturnType<typeof useRestTimer> }) {
  if (!timer.active && !timer.justFinished) return null
  const pct = timer.totalSec ? (timer.remainingSec / timer.totalSec) * 100 : 0

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)]" role="timer" aria-live="polite">
      <div className="h-1 bg-surface-2">
        <div className="h-full bg-accent transition-[width] duration-300" style={{ width: `${pct}%` }} />
      </div>
      <div className="mx-auto flex max-w-xl items-center gap-2 px-4 py-2">
        {timer.active ? (
          <>
            <div className="flex-1">
              <p className="text-xs text-muted">Rest</p>
              <p className="text-2xl font-bold tabular-nums">{formatDuration(timer.remainingSec)}</p>
            </div>
            <button type="button" onClick={() => timer.adjust(-15)} className="min-h-11 min-w-11 rounded-xl bg-surface-2 px-3" aria-label="15 seconds less">
              −15
            </button>
            <button type="button" onClick={() => timer.adjust(15)} className="min-h-11 min-w-11 rounded-xl bg-surface-2 px-3" aria-label="15 seconds more">
              +15
            </button>
            <button type="button" onClick={timer.skip} className="min-h-11 rounded-xl px-3 text-accent">
              Skip
            </button>
          </>
        ) : (
          <p className="flex min-h-11 flex-1 items-center font-semibold text-accent">Rest done: time for your next set</p>
        )}
      </div>
    </div>
  )
}
