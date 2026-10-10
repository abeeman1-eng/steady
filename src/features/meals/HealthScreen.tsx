import { BackButton } from '../../components/BackButton'
import { setHealthFlags } from '../../data/repositories/profileRepo'
import { blockingCondition } from '../../domain/health'
import { useProfile } from '../../lib/profileContext'
import { HealthChecklist } from './HealthChecklist'
import { TargetsBlockedNotice } from './MinorNotice'

/** Edit health considerations any time; the same checklist as in "Build my plan". */
export function HealthScreen() {
  const profile = useProfile()
  const flags = profile.healthFlags ?? []
  const blocked = blockingCondition(flags)

  return (
    <main className="mx-auto w-full max-w-xl px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-32">
      <BackButton parent="/settings" parentLabel="Settings" className="mb-2" />
      <header className="mb-6">
        <h1 className="text-[28px] leading-tight font-semibold">Health considerations</h1>
        <p className="mt-2 text-[15px] text-muted">Food suggestions, meal ideas and limits adjust to what you tick here. Changes apply right away.</p>
      </header>
      <div className="flex flex-col gap-6">
        {blocked && <TargetsBlockedNotice reason={blocked} />}
        <HealthChecklist value={flags} onChange={(next) => setHealthFlags(next)} />
      </div>
    </main>
  )
}
