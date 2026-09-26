import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Sheet } from '../../components/Sheet'
import { Button, Card, Field, Stepper, inputClass } from '../../components/ui'
import { deleteEntry, getEntriesForDate, moveEntry, saveMealAsFavorite, updateEntryServings } from '../../data/repositories/mealRepo'
import type { MealEntryRecord } from '../../data/schema'
import { addDays, formatDate, todayISO } from '../../domain/dates'
import { type MealType, MEAL_TYPES, formatCalories, formatServings, scaleNutrition, sumNutrition } from '../../domain/nutrition'
import { useProfile } from '../../lib/profileContext'
import { MacroGrid } from './FoodConfirmSheet'
import { NutritionSummary } from './NutritionSummary'

const entryNutrition = (e: MealEntryRecord) => scaleNutrition(e, e.servings)

export function MealsScreen() {
  const [params, setParams] = useSearchParams()
  const today = todayISO()
  const date = params.get('date') ?? today
  const profile = useProfile()
  const entries = useLiveQuery(() => getEntriesForDate(date), [date])
  const [editing, setEditing] = useState<MealEntryRecord | null>(null)
  const [savingMeal, setSavingMeal] = useState<MealType | null>(null)

  const go = (d: string) => setParams(d === today ? {} : { date: d }, { replace: true })
  const dayLabel = date === today ? 'Today' : date === addDays(today, -1) ? 'Yesterday' : formatDate(date)

  return (
    <main className="mx-auto w-full max-w-xl px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-28">
      <header className="mb-4 flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Food</h1>
        <div className="flex items-center gap-1" role="group" aria-label="Day">
          <button type="button" onClick={() => go(addDays(date, -1))} className="min-h-11 min-w-11 rounded-xl text-xl hover:bg-surface-2" aria-label="Previous day">
            ‹
          </button>
          <span className="min-w-24 text-center font-medium" aria-live="polite">
            {dayLabel}
          </span>
          <button type="button" onClick={() => go(addDays(date, 1))} disabled={date >= today} className="min-h-11 min-w-11 rounded-xl text-xl hover:bg-surface-2 disabled:opacity-30" aria-label="Next day">
            ›
          </button>
        </div>
      </header>

      {entries && (
        <div className="flex flex-col gap-4">
          <NutritionSummary totals={sumNutrition(entries.map(entryNutrition))} targets={profile.nutritionTargets} />

          {MEAL_TYPES.map((m) => {
            const items = entries.filter((e) => e.mealType === m.value)
            const total = sumNutrition(items.map(entryNutrition))
            return (
              <Card key={m.value} className="p-0">
                <div className="flex items-baseline justify-between px-4 pt-3">
                  <h2 className="text-lg font-semibold">{m.label}</h2>
                  {items.length > 0 && <span className="text-sm tabular-nums text-muted">{formatCalories(total.calories)} cal</span>}
                </div>
                {items.length > 0 && (
                  <ul className="mt-1">
                    {items.map((e) => (
                      <li key={e.id}>
                        <button type="button" onClick={() => setEditing(e)} className="flex min-h-14 w-full items-center justify-between gap-3 px-4 py-2 text-left hover:bg-surface-2">
                          <span className="min-w-0">
                            <span className="block truncate">{e.name}</span>
                            <span className="block truncate text-sm text-muted">
                              {formatServings(e.servings)} × {e.servingSize}
                            </span>
                          </span>
                          <span className="shrink-0 text-sm tabular-nums">{formatCalories(entryNutrition(e).calories)}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex flex-wrap items-center gap-1 p-2">
                  <Link to={`/meals/add?meal=${m.value}&date=${date}`} className="flex min-h-11 items-center rounded-xl px-3 text-accent hover:bg-surface-2">
                    + Add food
                  </Link>
                  {items.length > 1 && (
                    <button type="button" onClick={() => setSavingMeal(m.value)} className="min-h-11 rounded-xl px-3 text-sm text-muted hover:bg-surface-2">
                      ☆ Save as favorite meal
                    </button>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {editing && <EditEntrySheet entry={editing} onClose={() => setEditing(null)} />}
      {savingMeal && entries && (
        <SaveMealSheet
          suggested={`${MEAL_TYPES.find((m) => m.value === savingMeal)!.label} favorite`}
          count={entries.filter((e) => e.mealType === savingMeal).length}
          onSave={async (name) => {
            await saveMealAsFavorite(name, entries.filter((e) => e.mealType === savingMeal))
            setSavingMeal(null)
          }}
          onClose={() => setSavingMeal(null)}
        />
      )}
    </main>
  )
}

function EditEntrySheet({ entry, onClose }: { entry: MealEntryRecord; onClose: () => void }) {
  const [servings, setServings] = useState(entry.servings)
  const [meal, setMeal] = useState<MealType>(entry.mealType)
  const changed = servings !== entry.servings || meal !== entry.mealType

  return (
    <Sheet title="Edit entry" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="text-xl font-semibold">{entry.name}</h3>
          <p className="text-sm text-muted">Serving: {entry.servingSize}</p>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span>Servings</span>
          <Stepper label="Servings" value={servings} onChange={(v) => setServings(Math.max(0.5, v))} step={0.5} min={0.5} format={formatServings} />
        </div>
        <label className="flex items-center justify-between gap-3">
          <span>Meal</span>
          <select value={meal} onChange={(e) => setMeal(e.target.value as MealType)} className="min-h-11 rounded-xl border border-border bg-surface-2 px-3 focus:border-accent focus:outline-none">
            {MEAL_TYPES.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
        <MacroGrid nutrition={scaleNutrition(entry, servings)} />
        <Button
          block
          disabled={!changed}
          onClick={async () => {
            if (servings !== entry.servings) await updateEntryServings(entry.id, servings)
            if (meal !== entry.mealType) await moveEntry(entry.id, meal)
            onClose()
          }}
        >
          Save changes
        </Button>
        <Button
          block
          variant="danger"
          onClick={async () => {
            await deleteEntry(entry.id)
            onClose()
          }}
        >
          Remove from log
        </Button>
      </div>
    </Sheet>
  )
}

function SaveMealSheet({ suggested, count, onSave, onClose }: { suggested: string; count: number; onSave: (name: string) => void; onClose: () => void }) {
  const [name, setName] = useState(suggested)
  return (
    <Sheet title="Save favorite meal" onClose={onClose}>
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault()
          onSave(name)
        }}
      >
        <p className="text-sm text-muted">Saves these {count} foods so you can log them together in one tap from Favorites.</p>
        <Field label="Name">
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
        </Field>
        <Button type="submit" block>
          Save meal
        </Button>
      </form>
    </Sheet>
  )
}
