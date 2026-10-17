import type { RunTarget, Units } from '../../domain/types'
import { formatDistance } from '../../domain/units'

/** "5 km" or "25 min" */
export const runTargetAmount = (t: RunTarget, units: Units) => (t.distanceM ? formatDistance(t.distanceM, units) : `${t.durationMin} min`)
