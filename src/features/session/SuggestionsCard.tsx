import { useLiveQuery } from 'dexie-react-hooks'
import { acceptSuggestion, dismissSuggestion, listPendingSuggestions } from '../../data/repositories/workoutRepo'
import { EXERCISES_BY_ID } from '../../domain/exerciseLibrary'

/**
 * Suggestions for today's workout, based on the last sessions and their 1–10 ratings. Nothing
 * changes until the user taps Accept; "Keep current" dismisses it.
 */
export function SuggestionsCard({ workoutId }: { workoutId: string }) {
  const pending = useLiveQuery(() => listPendingSuggestions(workoutId), [workoutId])
  if (!pending?.length) return null

  return (
    <section aria-label="Suggestions for today" className="overflow-hidden rounded-[20px] bg-accent-soft ring-1 ring-accent/30 ring-inset">
      <p className="px-4 pt-4 text-[12px] font-semibold tracking-[0.06em] text-accent uppercase">Suggestions for today</p>
      <ul className="divide-y divide-accent/20">
        {pending.map((s) => (
          <li key={s.id} className="px-4 py-3">
            <p className="text-[15px] font-semibold">{EXERCISES_BY_ID.get(s.exerciseId)?.name ?? 'Exercise'}</p>
            <p className="mt-0.5 text-[14px] text-muted">{s.reason}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {s.kind === 'hold' ? (
                <button type="button" onClick={() => dismissSuggestion(s.id)} className="min-h-11 rounded-xl bg-surface-3 px-4 text-[14px] font-semibold">
                  Got it
                </button>
              ) : (
                <>
                  <button type="button" onClick={() => acceptSuggestion(s.id)} className="min-h-11 rounded-xl bg-accent px-4 text-[14px] font-semibold text-accent-ink">
                    Accept
                  </button>
                  <button type="button" onClick={() => dismissSuggestion(s.id)} className="min-h-11 rounded-xl bg-surface-3 px-4 text-[14px] font-semibold">
                    Keep current
                  </button>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
