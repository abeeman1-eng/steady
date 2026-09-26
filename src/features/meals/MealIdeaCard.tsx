import type { ReactNode } from 'react'
import { type PlannedMeal, portionLabel } from '../../domain/mealPlanner'
import { formatCalories } from '../../domain/nutrition'
import { MacroLine } from './NutritionUi'

/** A planned meal: name, totals, and each food with a realistic portion. */
export function MealIdeaCard({ meal, eyebrow, action }: { meal: PlannedMeal; eyebrow?: string; action?: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-[20px] bg-surface ring-1 ring-border ring-inset">
      <div className="flex items-start justify-between gap-3 px-4 pt-4">
        <div className="min-w-0">
          {eyebrow && <p className="text-[12px] font-semibold tracking-[0.06em] text-muted uppercase">{eyebrow}</p>}
          <h3 className="mt-0.5 text-[17px] font-semibold">{meal.name}</h3>
          <MacroLine n={meal.totals} className="mt-1" />
        </div>
        <span className="shrink-0 pt-0.5 text-[17px] font-semibold tabular-nums">
          {formatCalories(meal.totals.calories)} <span className="text-[12px] font-normal text-muted">cal</span>
        </span>
      </div>
      <ul className="mt-3 border-t border-border">
        {meal.items.map((item) => (
          <li key={item.food.id} className="flex items-baseline justify-between gap-3 border-b border-border px-4 py-2.5 last:border-b-0">
            <span className="min-w-0 truncate text-[14px]">{item.food.name}</span>
            <span className="shrink-0 text-[13px] text-muted tabular-nums">{portionLabel(item.food, item.grams)}</span>
          </li>
        ))}
      </ul>
      {action && <div className="border-t border-border p-2">{action}</div>}
    </section>
  )
}
