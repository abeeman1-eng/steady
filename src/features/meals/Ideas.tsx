import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ButtonLink, Card, Chevron, Section } from '../../components/ui'
import type { DietStyle } from '../../domain/foodCatalog'
import { type Focus, type Recommendation, portionLabel, rankGaps, recommendFoods } from '../../domain/mealPlanner'
import { type MealType, MEAL_TYPES, type Nutrition, NUTRIENTS, type UsdaFood, formatCalories, mealForTime } from '../../domain/nutrition'
import { FoodConfirmSheet } from './FoodConfirmSheet'
import { useUsdaLookup } from './useUsdaLookup'

const FOCUS_COPY: Record<Recommendation['focus'], string> = {
  proteinG: 'protein',
  carbsG: 'carbs',
  fatG: 'healthy fats',
  fiberG: 'fiber',
}

/**
 * "Ideas for today": the biggest gap left against the user's targets, with everyday foods sized
 * to close it. Without targets, it points to the plan builder instead.
 */
export function IdeasCard({ totals, targets, diet, date, fiberUnmeasured }: { totals: Nutrition; targets?: Partial<Nutrition>; diet: DietStyle; date: string; fiberUnmeasured?: boolean }) {
  const lookup = useUsdaLookup()
  const [adding, setAdding] = useState<{ food: UsdaFood; grams: number } | null>(null)
  const [chosen, setChosen] = useState<Focus | null>(null)
  const meal: MealType = mealForTime()
  const hasTargets = !!targets && Object.keys(targets).length > 0

  if (!hasTargets) {
    return (
      <Card className="flex flex-col gap-3">
        <div>
          <p className="text-[15px] font-semibold">Not sure where to start?</p>
          <p className="mt-1 text-[14px] text-muted">Answer a few questions and Steady will build a daily plan with calories, protein, carbs and fat, plus a sample day of meals.</p>
        </div>
        <ButtonLink to="/meals/plan">Build my plan</ButtonLink>
      </Card>
    )
  }

  const exclude: Focus[] = fiberUnmeasured ? ['fiberG'] : []
  const gaps = rankGaps(totals, targets!, exclude)
  const focus = chosen && gaps.some((g) => g.focus === chosen) ? chosen : gaps[0]?.focus
  const rec = lookup && focus ? recommendFoods(totals, targets!, diet, lookup.per100, { focus, exclude }) : null
  const mealLabel = MEAL_TYPES.find((m) => m.value === meal)!.label.toLowerCase()

  return (
    <Section title="Ideas for today">
      <div className="overflow-hidden rounded-[20px] bg-surface ring-1 ring-border ring-inset">
        {rec ? (
          <>
            <div className="px-4 pt-4 pb-2">
              <p className="text-[15px] font-semibold">
                {Math.round(rec.remaining)} {NUTRIENTS[rec.focus].unit} {FOCUS_COPY[rec.focus]} left
              </p>
              <p className="mt-0.5 text-[13px] text-muted">These fit what you have left today. Tap one to add it.</p>
              {gaps.length > 1 && (
                <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="Suggest foods for">
                  {gaps.map((g) => (
                    <button
                      key={g.focus}
                      type="button"
                      role="radio"
                      aria-checked={g.focus === focus}
                      onClick={() => setChosen(g.focus)}
                      className={`min-h-11 rounded-full px-4 text-[13px] transition ${g.focus === focus ? 'bg-text font-semibold text-bg' : 'bg-surface-2 text-muted ring-1 ring-border ring-inset hover:text-text'}`}
                    >
                      {NUTRIENTS[g.focus].label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <ul className="divide-y divide-border">
              {rec.items.map((item) => {
                const usda = lookup!.byId.get(item.food.fdcId)
                return (
                  <li key={item.food.id}>
                    <button type="button" disabled={!usda} onClick={() => usda && setAdding({ food: usda, grams: item.grams })} className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-surface-2">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px]">{item.food.name}</span>
                        <span className="mt-0.5 block truncate text-[13px] text-muted">
                          {portionLabel(item.food, item.grams)} · <span className="text-text">+{Math.round(item.nutrition[rec.focus] ?? 0)} {NUTRIENTS[rec.focus].unit} {FOCUS_COPY[rec.focus]}</span> · {formatCalories(item.nutrition.calories)} cal
                        </span>
                      </span>
                      <span aria-hidden className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-lg text-accent">
                        +
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </>
        ) : (
          <p className="px-4 py-4 text-[14px] text-muted">{lookup ? 'You’re on track today. Nice work.' : 'Loading ideas…'}</p>
        )}
        <Link to={`/meals/ideas?meal=${meal}&date=${date}`} className="flex min-h-12 items-center justify-between border-t border-border px-4 text-[15px] font-medium text-accent transition hover:bg-surface-2">
          Meal ideas for {mealLabel}
          <Chevron />
        </Link>
      </div>
      {adding && (
        <FoodConfirmSheet candidate={{ kind: 'usda', food: adding.food, grams: adding.grams }} mealType={meal} date={date} onDone={() => setAdding(null)} onClose={() => setAdding(null)} />
      )}
    </Section>
  )
}
