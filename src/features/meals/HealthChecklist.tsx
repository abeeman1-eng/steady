import { ChoiceList, Section } from '../../components/ui'
import { ALLERGENS, type Allergen, CONDITIONS, type Condition, type HealthFlag, allergensIn, conditionsIn } from '../../domain/health'

/**
 * Optional checklist of allergies and conditions. Allergies remove foods from suggestions;
 * conditions adjust limits and suggestions, and a few switch targets off. Saved only on device.
 */
export function HealthChecklist({ value, onChange }: { value: HealthFlag[]; onChange: (flags: HealthFlag[]) => void }) {
  const toggle = (flag: HealthFlag) => onChange(value.includes(flag) ? value.filter((f) => f !== flag) : [...value, flag])
  return (
    <div className="flex flex-col gap-6">
      <Section title="Allergies and intolerances">
        <ChoiceList<Allergen> multi label="Allergies and intolerances" value={allergensIn(value)} onChange={toggle} options={ALLERGENS} />
      </Section>
      <Section title="Health conditions">
        <ChoiceList<Condition> multi label="Health conditions" value={conditionsIn(value)} onChange={toggle} options={CONDITIONS} />
      </Section>
      <p className="px-1 text-[12px] leading-relaxed text-subtle">
        Optional. Saved only on this device, never sent anywhere. Steady tailors suggestions to these, but it isn’t medical advice; follow your doctor or dietitian if their guidance differs.
      </p>
    </div>
  )
}
