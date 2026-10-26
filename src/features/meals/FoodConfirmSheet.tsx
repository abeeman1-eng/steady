import { useMemo, useState } from 'react'
import { Sheet } from '../../components/Sheet'
import { Button, Field, Stepper, inputClass } from '../../components/ui'
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

/** Quick amounts for foods logged by weight (a spoonful, a small handful, a snack bar, 100 g). */
const GRAM_PRESETS = [15, 30, 50, 100]

/**
 * Packaged foods with no serving size are logged by weight. That's a scanned product with only
 * per-100 g values, or a food saved that way (its serving is a plain amount like "15 g").
 * Returns the per-100 g nutrition and the amount to start with (none: the user must enter one).
 */
function gramsBasis(c: FoodCandidate): { per100: Nutrition; initialGrams?: number } | null {
  if (c.kind === 'product') {
    // Older cached lookups have no per100gOnly flag, but their serving is exactly "100 g".
    if (c.product.per100gOnly || c.product.servingSize === '100 g') return { per100: c.product.nutrition }
    return null
  }
  if (c.kind === 'saved' && c.food.source === 'openFoodFacts') {
    const m = c.food.servingSize.match(/^(\d+(?:\.\d+)?) g$/)
    const grams = m ? Number(m[1]) : NaN
    if (!(grams > 0)) return null
    return { per100: scaleNutrition(c.food, 100 / grams), initialGrams: grams === 100 ? undefined : grams }
  }
  return null
}

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
  const standard = usdaServingOptions(c.food)
  // A suggested amount that isn't a standard serving (e.g. 150 g chicken) goes first.
  const custom = c.grams !== undefined && !standard.some((o) => Math.abs(o.grams - c.grams!) < 0.01) ? [{ label: `${Math.round(c.grams)} g`, grams: c.grams }] : []
  return {
    name,
    options: [...custom, ...standard].map((o) => {
      const nutrition = nutritionForGrams(per100, o.grams)
      return { label: o.label, nutrition, toFood: () => ({ name, servingSize: o.label, ...nutrition, source: 'usda', externalId: `usda:${c.food[0]}:${o.grams}` }) }
    }),
  }
}

export function FoodConfirmSheet({
  candidate,
  mealType,
  date,
  onDone,
  onClose,
  onWrongProduct,
}: {
  candidate: FoodCandidate
  mealType: MealType
  date: string
  onDone: () => void
  onClose: () => void
  /** For a product found by barcode: the user says it isn't what they scanned. */
  onWrongProduct?: () => void
}) {
  const { name, options } = useMemo(() => optionsFor(candidate), [candidate])
  const byWeight = useMemo(() => gramsBasis(candidate), [candidate])
  const [gramsText, setGramsText] = useState(() => (byWeight?.initialGrams ? String(byWeight.initialGrams) : ''))
  const grams = parseFloat(gramsText)
  const gramsValid = Number.isFinite(grams) && grams > 0 && grams <= 2000
  const [optionIndex, setOptionIndex] = useState(() => {
    if (candidate.kind !== 'usda') return 0
    if (candidate.grams === undefined) return defaultServingIndex(usdaServingOptions(candidate.food), candidate.food[1])
    return Math.max(0, options.findIndex((o) => o.label.includes(`(${Math.round(candidate.grams!)} g)`) || o.label === `${Math.round(candidate.grams!)} g`))
  })
  const [servings, setServings] = useState(1)
  const initialFavorite = candidate.kind === 'saved' ? candidate.food.isFavorite : candidate.kind === 'usda' ? !!candidate.isFavorite : false
  const [favorite, setFav] = useState(initialFavorite)
  const [saving, setSaving] = useState(false)
  const option = options[optionIndex]
  const total = byWeight ? (gramsValid ? nutritionForGrams(byWeight.per100, grams) : null) : scaleNutrition(option.nutrition, servings)
  const barcode = candidate.kind === 'product' ? candidate.barcode : candidate.kind === 'saved' ? candidate.food.barcode : undefined
  const mealLabel = MEAL_TYPES.find((m) => m.value === mealType)!.label

  async function add() {
    setSaving(true)
    try {
      let foodId: string
      if (byWeight) {
        // Save the food at the amount eaten, so the next scan starts from the same amount.
        const amount = Math.round(grams * 10) / 10
        foodId = await upsertFood({ name, servingSize: `${amount} g`, ...nutritionForGrams(byWeight.per100, amount), source: 'openFoodFacts', barcode })
      } else {
        foodId = candidate.kind === 'saved' ? candidate.food.id : await upsertFood(option.toFood!())
      }
      if (favorite !== initialFavorite) await setFavorite(foodId, favorite)
      await logFood(date, mealType, foodId, byWeight ? 1 : servings)
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

        {candidate.kind === 'product' && (
          <div className="rounded-2xl bg-surface-2 p-3 text-[14px] ring-1 ring-border ring-inset">
            <p>
              <span className="font-semibold">Is this your product?</span> Check the name against the package.
              {candidate.barcode && <span className="text-muted"> Barcode {candidate.barcode}.</span>}
            </p>
            {onWrongProduct && (
              <button type="button" onClick={onWrongProduct} className="mt-1 min-h-11 font-semibold text-accent">
                Not my product, enter it myself
              </button>
            )}
          </div>
        )}

        {byWeight ? (
          <div className="flex flex-col gap-2">
            <Field label="How much did you have? (grams)" hint="This product doesn't list a serving size. Check the label, or weigh it.">
              <input
                className={inputClass}
                type="number"
                inputMode="decimal"
                min={1}
                max={2000}
                value={gramsText}
                onChange={(e) => setGramsText(e.target.value)}
                placeholder="e.g. 37"
              />
            </Field>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Quick amounts">
              {GRAM_PRESETS.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGramsText(String(g))}
                  aria-pressed={grams === g}
                  className={`min-h-11 rounded-full px-4 text-sm ${grams === g ? 'bg-accent text-accent-ink font-semibold' : 'bg-surface-2 text-text'}`}
                >
                  {g} g
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
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
          </>
        )}

        {total ? <NutrientPanel nutrition={total} /> : <p className="text-sm text-muted">Enter an amount to see calories and nutrients.</p>}

        <Button block onClick={add} disabled={saving || (!!byWeight && !gramsValid)}>
          {saving ? 'Adding…' : `Add to ${mealLabel}`}
        </Button>
      </div>
    </Sheet>
  )
}
