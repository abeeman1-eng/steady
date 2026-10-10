import { Card } from '../../components/ui'
import { MIN_TARGET_AGE, type BlockReason } from '../../domain/targets'

const COPY: Record<BlockReason, { title: string; body: string; help: string }> = {
  minor: {
    title: `Nutrition targets are for ${MIN_TARGET_AGE} and over`,
    body: `Growing bodies need enough energy, and calorie targets from a formula, especially ones for losing weight, aren’t safe for teens. So Steady doesn’t suggest or set calorie and macro targets for anyone under ${MIN_TARGET_AGE}.`,
    help: 'A doctor, registered dietitian or school nurse can help with food goals.',
  },
  kidneyDisease: {
    title: 'Targets switched off for kidney disease',
    body: 'Steady’s formulas raise protein for active people, which can strain the kidneys. Protein, sodium and other limits for kidney disease need to come from your care team.',
    help: 'Your doctor or a renal dietitian can set targets that are right for you.',
  },
  pregnancy: {
    title: 'Targets switched off during pregnancy and breastfeeding',
    body: 'Your energy needs change week to week, and calorie deficits aren’t recommended. So Steady won’t suggest or set calorie and macro targets.',
    help: 'Your doctor, midwife or a registered dietitian can guide what to eat.',
  },
  eatingDisorder: {
    title: 'No calorie or macro targets',
    body: 'Numbers to hit can work against recovery, so Steady won’t suggest or show targets. If seeing calorie totals isn’t helpful either, you can turn meal tracking off in Settings.',
    help: 'A doctor, therapist or registered dietitian who specializes in eating disorders can help.',
  },
}

/** Shown instead of nutrition targets and plans when targets are switched off. */
export function TargetsBlockedNotice({ reason }: { reason: BlockReason }) {
  const c = COPY[reason]
  return (
    <Card className="flex flex-col gap-3">
      <p className="text-[17px] font-semibold">{c.title}</p>
      <p className="text-[15px] text-muted">{c.body}</p>
      <p className="text-[15px] text-muted">{c.help} You can still log what you eat, browse meal ideas and use your training plan.</p>
    </Card>
  )
}

/** Kept for the under-18 case, where the reason is always age. */
export function MinorNotice() {
  return <TargetsBlockedNotice reason="minor" />
}
