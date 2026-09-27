import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Card, Segmented } from '../../components/ui'
import { getEntriesForDate, logPlannedItems } from '../../data/repositories/mealRepo'
import { todayISO } from '../../domain/dates'
import { MEAL_SHARES } from '../../domain/foodCatalog'
import { type PlannedMeal, mealIdeas } from '../../domain/mealPlanner'
import { type MealType, MEAL_TYPES, type Nutrition, formatCalories, scaleNutrition, sumNutrition } from '../../domain/nutrition'
import { useNutritionTargets } from '../../lib/useNutritionTargets'
import { useProfile } from '../../lib/profileContext'
import { useUsdaLookup } from './useUsdaLookup'
import { MealIdeaCard } from './MealIdeaCard'

/** Used only to size ideas when no targets are set yet. */
const GENERIC_DAY: Nutrition = { calories: 2000, proteinG: 100, carbsG: 230, fatG: 70 }

const isMeal = (v: string | null): v is MealType => MEAL_TYPES.some((m) => m.value === v)

/**
 * How much of today's remaining targets this meal should get: its share among the meals that
 * haven't been logged yet. Falls back to its normal share of the day if the day is used up.
 */
function mealBudget(meal: MealType, targets: Nutrition, entries: (Nutrition & { mealType: MealType; servings: number })[]): Nutrition {
  const eaten = sumNutrition(entries.map((e) => scaleNutrition(e, e.servings)))
  const logged = new Set(entries.map((e) => e.mealType))
  const open = MEAL_TYPES.map((m) => m.value).filter((m) => m === meal || !logged.has(m))
  const share = MEAL_SHARES[meal] / open.reduce((s, m) => s + MEAL_SHARES[m], 0)
  const left = (k: keyof Nutrition) => Math.max(0, (targets[k] ?? 0) - (eaten[k] ?? 0))
  const budget = { calories: left('calories') * share, proteinG: left('proteinG') * share, carbsG: left('carbsG') * share, fatG: left('fatG') * share }
  return budget.calories < 150 ? scaleNutrition(targets, MEAL_SHARES[meal]) : budget
}

export function MealIdeasScreen() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const profile = useProfile()
  const meal: MealType = isMeal(params.get('meal')) ? (params.get('meal') as MealType) : 'lunch'
  const date = params.get('date') ?? todayISO()
  const entries = useLiveQuery(() => getEntriesForDate(date), [date])
  const lookup = useUsdaLookup()
  const [logging, setLogging] = useState<string | null>(null)

  const { targets: t, minor } = useNutritionTargets()
  const hasTargets = !!t?.calories && !!t.proteinG
  const daily: Nutrition = hasTargets ? { calories: t!.calories!, proteinG: t!.proteinG!, carbsG: t!.carbsG ?? (t!.calories! * 0.45) / 4, fatG: t!.fatG ?? (t!.calories! * 0.3) / 9 } : GENERIC_DAY
  const budget = entries && hasTargets ? mealBudget(meal, daily, entries) : scaleNutrition(daily, MEAL_SHARES[meal])
  const ideas = lookup ? mealIdeas(meal, budget, profile.dietStyle ?? 'any', lookup.per100, 4) : null
  const mealLabel = MEAL_TYPES.find((m) => m.value === meal)!.label

  async function log(idea: PlannedMeal) {
    setLogging(idea.template.id)
    await logPlannedItems(
      date,
      meal,
      idea.items.map((i) => ({ name: i.food.name, fdcId: i.food.fdcId, grams: i.grams, nutrition: i.nutrition })),
    )
    navigate(`/meals?date=${date}`, { replace: true })
  }

  return (
    <main className="mx-auto w-full max-w-xl px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-32">
      <button type="button" onClick={() => navigate(-1)} className="-ml-1 mb-2 inline-flex min-h-11 items-center px-1 text-[15px] font-medium text-accent">
        ‹ Back
      </button>
      <header className="mb-5">
        <h1 className="text-[28px] leading-tight font-semibold">Meal ideas</h1>
        <p className="mt-2 text-[15px] text-muted">
          {hasTargets ? (
            <>
              Sized for what you have left today: about <span className="font-medium text-text tabular-nums">{formatCalories(budget.calories)} cal</span> and{' '}
              <span className="font-medium text-text tabular-nums">{Math.round(budget.proteinG)} g protein</span> for {mealLabel.toLowerCase()}.
            </>
          ) : (
            <>
              Sized for a typical 2,000-calorie day.{' '}
              {!minor && (
                <>
                  <Link to="/meals/plan" className="font-medium text-accent">Build your plan</Link> to size them for you.
                </>
              )}
            </>
          )}
        </p>
      </header>

      <div className="flex flex-col gap-5">
        {hasTargets && budget.proteinG * 4 > budget.calories * 0.6 && (
          <p className="rounded-2xl bg-surface-2 px-4 py-3 text-[14px] text-muted ring-1 ring-border ring-inset">
            That’s a lot of protein for the calories left. Meals below get as close as they can. Lean picks like chicken breast, tuna, egg whites or Greek yogurt will get you closest.
          </p>
        )}

        <Segmented<MealType> label="Meal" value={meal} onChange={(m) => setParams({ meal: m, date }, { replace: true })} options={MEAL_TYPES.map((m) => ({ value: m.value, label: m.value === 'snacks' ? 'Snack' : m.label }))} />

        {!ideas ? (
          <Card className="h-40 animate-pulse" />
        ) : ideas.length === 0 ? (
          <Card>
            <p className="text-muted">No ideas for this meal with your diet style yet.</p>
          </Card>
        ) : (
          ideas.map((idea) => (
            <MealIdeaCard
              key={idea.template.id}
              meal={idea}
              action={
                <button type="button" onClick={() => log(idea)} disabled={logging !== null} className="flex min-h-11 w-full items-center justify-center rounded-xl text-[15px] font-semibold text-accent transition hover:bg-surface-2 disabled:opacity-50">
                  {logging === idea.template.id ? 'Adding…' : `Log this as ${mealLabel.toLowerCase()}`}
                </button>
              }
            />
          ))
        )}
        <p className="px-1 text-[12px] leading-relaxed text-subtle">Portions are suggestions. Swap in foods you like; the food log will keep your totals accurate.</p>
      </div>
    </main>
  )
}
