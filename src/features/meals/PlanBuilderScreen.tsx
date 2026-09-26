import { useLiveQuery } from 'dexie-react-hooks'
import { type ReactNode, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, ChoiceList, Field, Section, Segmented, inputClass } from '../../components/ui'
import { getLatestBodyWeight } from '../../data/repositories/bodyRepo'
import { updateProfile } from '../../data/repositories/profileRepo'
import { DIET_STYLES, type DietStyle, MEAL_SHARES } from '../../domain/foodCatalog'
import { MEAL_ORDER, planDay } from '../../domain/mealPlanner'
import { MEAL_TYPES, type Nutrition, formatCalories, sumNutrition } from '../../domain/nutrition'
import { ACTIVITY_LEVELS, type ActivityLevel, NUTRITION_GOALS, type NutritionGoal, type Sex, ageFromBirthYear, birthYearFromAge, nutritionGoalFromGoals, suggestTargets } from '../../domain/targets'
import { useProfile } from '../../lib/profileContext'
import { HeightField, WeightField } from './BodyInputs'
import { MealIdeaCard } from './MealIdeaCard'
import { useUsdaLookup } from './useUsdaLookup'

type Step = 'intro' | 'about' | 'activity' | 'goal' | 'diet' | 'result'
const STEPS: Step[] = ['intro', 'about', 'activity', 'goal', 'diet', 'result']

/**
 * A guided path to a nutrition plan for people who don't know where to start: a few questions,
 * then daily targets explained in plain language, a split across meals, and a sample day of
 * real foods sized to hit them. Nothing is saved as targets until the user accepts.
 */
export function PlanBuilderScreen() {
  const profile = useProfile()
  const navigate = useNavigate()
  const latest = useLiveQuery(getLatestBodyWeight)
  const [step, setStep] = useState<Step>('intro')
  const index = STEPS.indexOf(step)
  const go = (delta: number) => setStep(STEPS[Math.min(STEPS.length - 1, Math.max(0, index + delta))])

  const age = profile.birthYear ? ageFromBirthYear(profile.birthYear) : undefined
  const goal = profile.nutritionGoal ?? nutritionGoalFromGoals(profile.goals)
  const diet = profile.dietStyle ?? 'any'
  const aboutDone = !!(profile.sex && age && profile.heightCm && latest)

  const canContinue: Record<Step, boolean> = { intro: true, about: aboutDone, activity: !!profile.activityLevel, goal: true, diet: true, result: true }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-32">
      <div className="flex min-h-11 items-center gap-3">
        <button type="button" onClick={() => (index === 0 ? navigate(-1) : go(-1))} className="-ml-1 inline-flex min-h-11 items-center px-1 text-[15px] font-medium text-accent">
          ‹ {index === 0 ? 'Cancel' : 'Back'}
        </button>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3" role="progressbar" aria-label="Plan builder progress" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={index + 1}>
          <div className="h-full rounded-full bg-accent transition-all duration-300" style={{ width: `${((index + 1) / STEPS.length) * 100}%` }} />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-6 pt-6">
        {step === 'intro' && (
          <Question title="Let’s build your nutrition plan" hint="Five quick questions. At the end you’ll get daily targets for calories, protein, carbs and fat, how to spread them across your meals, and a sample day of real food.">
            <Card className="flex flex-col gap-3 text-[14px] text-muted">
              <p>
                <span className="font-medium text-text">Why protein matters:</span> it helps you recover from workouts and keeps you full.
              </p>
              <p>
                <span className="font-medium text-text">Carbs</span> fuel your training, and <span className="font-medium text-text">fats</span> support your hormones and help you absorb vitamins.
              </p>
              <p>You can change everything later, and nothing is saved until you choose to use the plan.</p>
            </Card>
          </Question>
        )}

        {step === 'about' && (
          <Question title="A bit about you" hint="Used to estimate how much energy your body uses.">
            <Card className="flex flex-col gap-5">
              <Field label="Sex" hint="Only used in the calorie formula.">
                <Segmented<Sex>
                  label="Sex"
                  value={profile.sex}
                  onChange={(sex) => updateProfile({ sex })}
                  options={[
                    { value: 'female', label: 'Female' },
                    { value: 'male', label: 'Male' },
                    { value: 'unspecified', label: 'Prefer not to say' },
                  ]}
                />
              </Field>
              <Field label="Age">
                <input
                  className={inputClass}
                  type="number"
                  inputMode="numeric"
                  min={13}
                  max={100}
                  defaultValue={age ?? ''}
                  onChange={(e) => {
                    const n = parseInt(e.target.value, 10)
                    if (n >= 13 && n <= 100) void updateProfile({ birthYear: birthYearFromAge(n) })
                  }}
                />
              </Field>
              <HeightField />
              <WeightField latestKg={latest?.weightKg} latestDate={latest?.date} />
            </Card>
          </Question>
        )}

        {step === 'activity' && (
          <Question title="How active are you on a typical day?" hint="Count your workouts too.">
            <ChoiceList<ActivityLevel>
              label="Activity level"
              value={profile.activityLevel}
              onChange={(activityLevel) => updateProfile({ activityLevel })}
              options={(Object.keys(ACTIVITY_LEVELS) as ActivityLevel[]).map((a) => ({ value: a, label: ACTIVITY_LEVELS[a].label, hint: ACTIVITY_LEVELS[a].hint }))}
            />
          </Question>
        )}

        {step === 'goal' && (
          <Question title="What’s your goal with food?" hint="We picked one based on your training goals. Change it if it isn’t right.">
            <ChoiceList<NutritionGoal> label="Nutrition goal" value={goal} onChange={(nutritionGoal) => updateProfile({ nutritionGoal })} options={NUTRITION_GOALS} />
          </Question>
        )}

        {step === 'diet' && (
          <Question title="How do you eat?" hint="Meal ideas and food suggestions will match this.">
            <ChoiceList<DietStyle> label="Diet style" value={diet} onChange={(dietStyle) => updateProfile({ dietStyle })} options={DIET_STYLES} />
          </Question>
        )}

        {step === 'result' && aboutDone && profile.activityLevel && (
          <PlanResult
            inputs={{ sex: profile.sex!, age: age!, heightCm: profile.heightCm!, weightKg: latest!.weightKg, activity: profile.activityLevel, goals: profile.goals, nutritionGoal: goal }}
            diet={diet}
            onAccept={async (targets) => {
              await updateProfile({ nutritionTargets: targets, nutritionTargetsBasis: { weightKg: latest!.weightKg, setAt: new Date().toISOString() }, dietStyle: diet, nutritionGoal: goal })
            }}
          />
        )}
      </div>

      {step !== 'result' && (
        <Button block onClick={() => go(1)} disabled={!canContinue[step]} className="mt-6">
          {step === 'intro' ? 'Get started' : step === 'diet' ? 'See my plan' : 'Continue'}
        </Button>
      )}
    </main>
  )
}

function Question({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-5">
      <div>
        <h1 className="text-[28px] leading-tight font-semibold">{title}</h1>
        {hint && <p className="mt-2 text-[15px] text-muted">{hint}</p>}
      </div>
      {children}
    </section>
  )
}

const SPLIT: { key: 'proteinG' | 'carbsG' | 'fatG'; label: string; kcalPerG: number; color: string }[] = [
  { key: 'proteinG', label: 'Protein', kcalPerG: 4, color: 'var(--protein)' },
  { key: 'carbsG', label: 'Carbs', kcalPerG: 4, color: 'var(--carbs)' },
  { key: 'fatG', label: 'Fat', kcalPerG: 9, color: 'var(--fat)' },
]

function PlanResult({ inputs, diet, onAccept }: { inputs: Parameters<typeof suggestTargets>[0]; diet: DietStyle; onAccept: (t: Required<Nutrition>) => Promise<void> }) {
  const navigate = useNavigate()
  const lookup = useUsdaLookup()
  const [variant, setVariant] = useState(0)
  const [saving, setSaving] = useState(false)
  const s = useMemo(() => suggestTargets(inputs), [inputs])
  const t = s.targets
  const day = useMemo(() => (lookup ? planDay(t, diet, lookup.per100, variant) : null), [lookup, t, diet, variant])
  const dayTotals = day ? sumNutrition(MEAL_ORDER.map((m) => day[m].totals)) : null
  const macroCalories = SPLIT.reduce((sum, m) => sum + t[m.key] * m.kcalPerG, 0)

  async function accept(then: string) {
    setSaving(true)
    await onAccept(t)
    navigate(then, { replace: true })
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-[12px] font-semibold tracking-[0.06em] text-accent uppercase">Your plan</p>
        <h1 className="mt-1 text-[28px] leading-tight font-semibold">
          {t.calories.toLocaleString()} calories a day
        </h1>
        <p className="mt-2 text-[15px] text-muted">
          Your body uses about {s.maintenance.toLocaleString()} calories a day. This plan is {s.adjustmentReason}.
          {s.raisedToMinimum ? ' It’s been raised to a safe minimum.' : ''}
        </p>
      </div>

      <Card className="flex flex-col gap-4">
        {/* Share of calories from each macro: a single stacked bar with direct labels below. */}
        <div className="flex h-3 gap-0.5 overflow-hidden rounded-full" role="img" aria-label={SPLIT.map((m) => `${m.label} ${Math.round(((t[m.key] * m.kcalPerG) / macroCalories) * 100)}%`).join(', ')}>
          {SPLIT.map((m) => (
            <div key={m.key} style={{ width: `${((t[m.key] * m.kcalPerG) / macroCalories) * 100}%`, background: m.color }} />
          ))}
        </div>
        <dl className="grid grid-cols-3 gap-3">
          {SPLIT.map((m) => (
            <div key={m.key}>
              <dt className="flex items-center gap-1.5 text-[13px] text-muted">
                <span aria-hidden className="size-2 rounded-full" style={{ background: m.color }} />
                {m.label}
              </dt>
              <dd className="mt-0.5 text-[22px] font-semibold tabular-nums">{t[m.key]} g</dd>
              <dd className="text-[12px] text-subtle">{Math.round(((t[m.key] * m.kcalPerG) / macroCalories) * 100)}% of calories</dd>
            </div>
          ))}
        </dl>
        <ul className="flex flex-col gap-1.5 border-t border-border pt-4 text-[13px] text-muted">
          <li>
            <span className="text-text">Protein:</span> {s.why.proteinG}.
          </li>
          <li>
            <span className="text-text">Fat:</span> {s.why.fatG.toLowerCase()}. <span className="text-text">Carbs:</span> {s.why.carbsG.toLowerCase()}.
          </li>
          <li>
            <span className="text-text">Also aim for</span> {t.fiberG} g fiber, and keep sugar under {t.sugarG} g, saturated fat under {t.satFatG} g and sodium under {t.sodiumMg.toLocaleString()} mg.
          </li>
        </ul>
      </Card>

      <Section title="Spread across your day">
        <ul className="divide-y divide-border overflow-hidden rounded-[20px] bg-surface ring-1 ring-border ring-inset">
          {MEAL_ORDER.map((m) => (
            <li key={m} className="flex items-center justify-between gap-3 px-4 py-3 text-[15px]">
              <span>{MEAL_TYPES.find((x) => x.value === m)!.label}</span>
              <span className="text-muted tabular-nums">
                ~{formatCalories(t.calories * MEAL_SHARES[m])} cal · {Math.round(t.proteinG * MEAL_SHARES[m])} g protein
              </span>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        title="A sample day"
        action={
          <button type="button" onClick={() => setVariant((v) => v + 1)} className="inline-flex min-h-11 items-center text-[13px] font-medium text-accent">
            Show another day
          </button>
        }
      >
        {!day || !dayTotals ? (
          <Card className="h-48 animate-pulse" />
        ) : (
          <>
            {MEAL_ORDER.map((m) => (
              <MealIdeaCard key={m} meal={day[m]} eyebrow={MEAL_TYPES.find((x) => x.value === m)!.label} />
            ))}
            <p className="px-1 text-[13px] text-muted">
              This sample day adds up to <span className="text-text tabular-nums">{formatCalories(dayTotals.calories)} cal</span> and{' '}
              <span className="text-text tabular-nums">{Math.round(dayTotals.proteinG)} g protein</span>. Use it as inspiration. Any foods work as long as the totals fit.
            </p>
          </>
        )}
      </Section>

      <div className="flex flex-col gap-2">
        <Button block onClick={() => accept('/meals')} disabled={saving}>
          {saving ? 'Saving…' : 'Use this plan'}
        </Button>
        <Button block variant="secondary" onClick={() => accept('/meals/targets')} disabled={saving}>
          Use it and fine-tune the numbers
        </Button>
      </div>

      <p className="px-1 text-[12px] leading-relaxed text-subtle">
        Estimates for healthy adults based on the Mifflin-St Jeor equation and common dietary guidelines, not medical advice. If you’re pregnant, breastfeeding, managing a health condition or under 18, check
        with a doctor or registered dietitian.
      </p>
    </div>
  )
}
