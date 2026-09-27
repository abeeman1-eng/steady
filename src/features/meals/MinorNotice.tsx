import { Card } from '../../components/ui'
import { MIN_TARGET_AGE } from '../../domain/targets'

/** Shown instead of nutrition targets and plans for anyone under 18. */
export function MinorNotice() {
  return (
    <Card className="flex flex-col gap-3">
      <p className="text-[17px] font-semibold">Nutrition targets are for {MIN_TARGET_AGE} and over</p>
      <p className="text-[15px] text-muted">
        Growing bodies need enough energy, and calorie targets from a formula, especially ones for losing weight, aren’t safe for teens. So Steady doesn’t suggest or set calorie
        and macro targets for anyone under {MIN_TARGET_AGE}.
      </p>
      <p className="text-[15px] text-muted">
        A doctor, registered dietitian or school nurse can help with food goals. You can still log what you eat, browse meal ideas and use your training plan.
      </p>
    </Card>
  )
}
