import { useMemo, useState } from 'react'
import { Sheet } from '../../components/Sheet'
import { Button, Stepper } from '../../components/ui'
import { NutrientPanel } from './NutritionUi'
import { usdaDisplayName } from '../../data/foodSources'
import { logFood, setFavorite, upsertFood, type NewFood } from '../../data/repositories/mealRepo'
import type { FoodRecord } from '../../data/schema'
import {
  type MealType,
  MEAL_TYPES,
  type Nutrition,
  type ParsedProduct,
  type UsdaFood,
  defaultServingIndex,
  formatServings,
  nutritionForGrams,
  scaleNutrition,
  usdaPer100g,
  usdaServingOptions,
} from '../../domain/nutrition'

/** Something the user picked to log: a USDA food, one of their foods, or a scanned product. */
export type FoodCandidate =
  /** grams and isFavorite are set when re-opening a saved food that came from the USDA list. */
  | { kind: 'usda'; food: UsdaFood; grams?: number; isFavorite?: boolean }
  | { kind: 'saved'; food: FoodRecord }
  | { kind: 'product'; product: ParsedProduct & { nutrition: Nutrition }; barcode?: string }

interface Option {
  label: string
  nutrition: Nutrition
  /** Builds the food to save for this serving (not needed for already-saved foods). */
  toFood?: () => NewFood
}

function optionsFor(c: FoodCandidate): { name: string; options: Option[] } {
  if (c.kind === 'saved') return { name: c.food.name, options: [{ label: c.food.servingSize, nutrition: c.food }] }
  if (c.kind === 'product') {
    const { product, barcode } = c
    return {
      name: product.name,
      options: [{ label: product.servingSize, nutrition: product.nutrition, toFood: () => ({ name: product.name, servingSize: product.servingSize, ...product.nutrition, source: 'openFoodFacts', barcode }) }],
    }
  }
  const name = usdaDisplayName(c.food)
  const per100 = usdaPer100g(c.food)
  return {
    name,
    options: usdaServingOptions(c.food).map((o) => {
      const nutrition = nutritionForGrams(per100, o.grams)
      return { label: o.label, nutrition, toFood: () => ({ name, servingSize: o.label, ...nutrition, source: 'usda', externalId: `usda:${c.food[0]}:${o.grams}` }) }
    }),
  }
}

export function FoodConfirmSheet({ candidate, mealType, date, onDone, onClose }: { candidate: FoodCandidate; mealType: MealType; date: string; onDone: () => void; onClose: () => void }) {
  const { name, options } = useMemo(() => optionsFor(candidate), [candidate])
  const [optionIndex, setOptionIndex] = useState(() => {
    if (candidate.kind !== 'usda') return 0
    const opts = usdaServingOptions(candidate.food)
    const saved = candidate.grams === undefined ? -1 : opts.findIndex((o) => Math.abs(o.grams - candidate.grams!) < 0.01)
    return saved >= 0 ? saved : defaultServingIndex(opts)
  })
  const [servings, setServings] = useState(1)
  const initialFavorite = candidate.kind === 'saved' ? candidate.food.isFavorite : candidate.kind === 'usda' ? !!candidate.isFavorite : false
  const [favorite, setFav] = useState(initialFavorite)
  const [saving, setSaving] = useState(false)
  const option = options[optionIndex]
  const total = scaleNutrition(option.nutrition, servings)
  const mealLabel = MEAL_TYPES.find((m) => m.value === mealType)!.label

  async function add() {
    setSaving(true)
    try {
      const foodId = candidate.kind === 'saved' ? candidate.food.id : await upsertFood(option.toFood!())
      if (favorite !== initialFavorite) await setFavorite(foodId, favorite)
      await logFood(date, mealType, foodId, servings)
      onDone()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet title="Add food" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-xl font-semibold">{name}</h3>
          <button
            type="button"
            onClick={() => setFav((f) => !f)}
            aria-pressed={favorite}
            aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}
            className={`min-h-11 min-w-11 rounded-xl text-2xl ${favorite ? 'text-gold' : 'text-muted'}`}
          >
            {favorite ? '★' : '☆'}
          </button>
        </div>

        {options.length > 1 ? (
          <label className="flex flex-col gap-1">
            <span className="text-sm text-muted">Serving</span>
            <select
              value={optionIndex}
              onChange={(e) => setOptionIndex(Number(e.target.value))}
              className="min-h-11 rounded-[14px] bg-surface-2 ring-1 ring-border ring-inset px-3 text-base focus:ring-2 focus:ring-accent focus:outline-none"
            >
              {options.map((o, i) => (
                <option key={o.label} value={i}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <p className="text-sm text-muted">Serving: {option.label}</p>
        )}

        <div className="flex items-center justify-between gap-3">
          <span>Servings</span>
          <Stepper label="Servings" value={servings} onChange={(v) => setServings(Math.max(0.5, v))} step={0.5} min={0.5} format={formatServings} />
        </div>

        <NutrientPanel nutrition={total} />

        <Button block onClick={add} disabled={saving}>
          {saving ? 'Adding…' : `Add to ${mealLabel}`}
        </Button>
      </div>
    </Sheet>
  )
}
