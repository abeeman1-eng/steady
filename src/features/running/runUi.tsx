import type { RunTarget, Units } from '../../domain/types'
import { runTargetAmount } from './runLabels'

/** Target, what to do and how it should feel, for Today and plan cards. */
export function RunTargetDetails({ target, units }: { target: RunTarget; units: Units }) {
  return (
    <div className="mt-2 flex flex-col gap-1">
      <p className="text-[28px] leading-none font-semibold tabular-nums">{runTargetAmount(target, units)}</p>
      <p className="mt-2 text-[15px]">{target.detail}</p>
      <p className="text-[14px] text-muted">{target.cue}</p>
    </div>
  )
}
