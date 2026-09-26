import { useLiveQuery } from 'dexie-react-hooks'
import { type ReactNode, useMemo, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { Button, ChoiceList } from '../../components/ui'
import { requestPersistentStorage } from '../../data/backup'
import { getProfile, saveOnboarding, updateProfile, type OnboardingAnswers } from '../../data/repositories/profileRepo'
import { generatePlan } from '../../domain/planGenerator'
import type { Equipment, ExperienceLevel, MainGoal, Units } from '../../domain/types'
import { EXPERIENCE_OPTIONS, GOAL_OPTIONS } from '../../lib/labels'
import { BodyStatsStep, type BodyStats } from './BodyStatsStep'
import { PlanPreview } from './PlanPreview'
import { RunningGoalStep } from './RunningGoalStep'

type Draft = Partial<OnboardingAnswers>

const toggle = <T,>(list: T[] | undefined, item: T): T[] => (list?.includes(item) ? list.filter((x) => x !== item) : [...(list ?? []), item])
type StepId = 'experience' | 'goal' | 'days' | 'equipment' | 'units' | 'body' | 'running' | 'review'

export function OnboardingScreen() {
  const [params] = useSearchParams()
  const editing = params.get('edit') === '1'
  const existing = useLiveQuery(getProfile)

  if (existing === undefined) return null
  if (!editing && existing) return <Navigate to="/" replace />
  return <OnboardingFlow editing={editing} initial={editing && existing ? existing : { equipment: [] }} />
}

function OnboardingFlow({ editing, initial }: { editing: boolean; initial: Draft }) {
  const navigate = useNavigate()
  const [draft, setDraft] = useState<Draft>(() => ({
    experienceLevel: initial.experienceLevel,
    goals: initial.goals ?? [],
    daysPerWeek: initial.daysPerWeek,
    equipment: initial.equipment ?? [],
    units: initial.units,
    heightCm: initial.heightCm,
    build: initial.build,
    runningGoal: initial.runningGoal,
  }))
  const [stepIndex, setStepIndex] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // When editing, body stats live in settings, so the flow only covers training answers.
  const steps = useMemo<StepId[]>(() => {
    const s: StepId[] = ['experience', 'goal', 'days', 'equipment']
    if (!editing) s.push('units', 'body')
    if (draft.goals?.includes('running')) s.push('running')
    s.push('review')
    return s
  }, [editing, draft.goals])

  const step = steps[Math.min(stepIndex, steps.length - 1)]
  const set = (changes: Draft) => setDraft((d) => ({ ...d, ...changes }))
  const next = () => setStepIndex((i) => Math.min(i + 1, steps.length - 1))
  const back = () => (stepIndex === 0 ? (editing ? navigate('/settings') : undefined) : setStepIndex((i) => i - 1))

  const complete = draft.experienceLevel && draft.goals?.length && draft.daysPerWeek && draft.equipment?.length && draft.units
  const plan = useMemo(
    () => (complete ? generatePlan({ experienceLevel: draft.experienceLevel!, goals: draft.goals!, daysPerWeek: draft.daysPerWeek!, equipment: draft.equipment! }) : null),
    [complete, draft.experienceLevel, draft.goals, draft.daysPerWeek, draft.equipment],
  )

  async function accept() {
    if (!plan || !complete) return
    setSaving(true)
    setError(null)
    try {
      await saveOnboarding(draft as OnboardingAnswers, plan)
      if (!editing) {
        const persisted = await requestPersistentStorage()
        await updateProfile({ persistentStorage: persisted })
      }
      navigate('/', { replace: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong saving your plan.')
      setSaving(false)
    }
  }

  const canContinue: Record<StepId, boolean> = {
    experience: !!draft.experienceLevel,
    goal: !!draft.goals?.length,
    days: !!draft.daysPerWeek,
    equipment: !!draft.equipment?.length,
    units: !!draft.units,
    body: true,
    running: true,
    review: true,
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="flex min-h-11 items-center gap-3">
        <Button variant="ghost" onClick={back} disabled={stepIndex === 0 && !editing} aria-label="Back" className="px-2">
          ← Back
        </Button>
        <div className="flex-1">
          <div className="h-2 overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuemin={1} aria-valuemax={steps.length} aria-valuenow={stepIndex + 1} aria-label="Onboarding progress">
            <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }} />
          </div>
        </div>
        <span className="w-12 text-right text-sm text-muted">
          {stepIndex + 1}/{steps.length}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-4 py-6">
        {step === 'experience' && (
          <Question title="How much have you exercised before?">
            <ChoiceList<ExperienceLevel>
              label="Experience level"
              value={draft.experienceLevel}
              onChange={(v) => set({ experienceLevel: v })}
              options={EXPERIENCE_OPTIONS}
            />
          </Question>
        )}

        {step === 'goal' && (
          <Question title="What are your goals?" hint="Choose all that apply.">
            <ChoiceList<MainGoal> multi label="Goals" value={draft.goals} onChange={(v) => set({ goals: toggle(draft.goals, v) })} options={GOAL_OPTIONS} />
          </Question>
        )}

        {step === 'days' && (
          <Question title="How many days a week can you train?" hint="Pick what you can keep up. You can change this any time.">
            <ChoiceList<number>
              label="Days per week"
              value={draft.daysPerWeek}
              onChange={(v) => set({ daysPerWeek: v })}
              options={[2, 3, 4, 5, 6].map((n) => ({ value: n, label: `${n} days` }))}
            />
          </Question>
        )}

        {step === 'equipment' && (
          <Question title="What equipment do you have?" hint="Choose all that apply.">
            <ChoiceList<Equipment>
              multi
              label="Equipment"
              value={draft.equipment}
              onChange={(v) => set({ equipment: toggle(draft.equipment, v) })}
              options={[
                { value: 'gym', label: 'Full gym', hint: 'Barbells, machines, cables' },
                { value: 'dumbbells', label: 'Dumbbells' },
                { value: 'bands', label: 'Resistance bands' },
                { value: 'bodyweight', label: 'Bodyweight only', hint: 'No equipment needed' },
              ]}
            />
          </Question>
        )}

        {step === 'units' && (
          <Question title="Which units do you use?">
            <ChoiceList<Units>
              label="Units"
              value={draft.units}
              onChange={(v) => set({ units: v })}
              options={[
                { value: 'imperial', label: 'Imperial', hint: 'Pounds, feet, miles' },
                { value: 'metric', label: 'Metric', hint: 'Kilograms, centimeters, kilometers' },
              ]}
            />
          </Question>
        )}

        {step === 'body' && (
          <Question title="A bit about you" hint="Optional. Your starting weight becomes the first point on your body weight chart.">
            <BodyStatsStep
              units={draft.units ?? 'imperial'}
              value={{ heightCm: draft.heightCm, weightKg: draft.weightKg, build: draft.build }}
              onChange={(v: BodyStats) => set(v)}
            />
          </Question>
        )}

        {step === 'running' && (
          <Question title="What are you running toward?" hint="Your full running plan arrives in the next update. We’ll save your goal now.">
            <RunningGoalStep units={draft.units ?? 'imperial'} value={draft.runningGoal} onChange={(runningGoal) => set({ runningGoal })} />
          </Question>
        )}

        {step === 'review' && plan && (
          <Question title="Here’s your plan">
            <PlanPreview plan={plan} />
            {error && (
              <p role="alert" className="text-danger">
                {error}
              </p>
            )}
          </Question>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {step === 'review' ? (
          <>
            <Button block onClick={accept} disabled={saving || !plan}>
              {saving ? 'Saving…' : 'Accept plan'}
            </Button>
            <Button block variant="secondary" onClick={() => setStepIndex(0)} disabled={saving}>
              Adjust answers
            </Button>
          </>
        ) : (
          <>
            <Button block onClick={next} disabled={!canContinue[step]}>
              Continue
            </Button>
            {(step === 'body' || step === 'running') && (
              <Button
                block
                variant="ghost"
                onClick={() => {
                  set(step === 'body' ? { heightCm: undefined, weightKg: undefined, build: undefined } : { runningGoal: undefined })
                  next()
                }}
              >
                Skip for now
              </Button>
            )}
          </>
        )}
      </div>
    </main>
  )
}

function Question({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h1 className="text-[28px] leading-tight font-semibold">{title}</h1>
        {hint && <p className="mt-1 text-muted">{hint}</p>}
      </div>
      {children}
    </section>
  )
}
