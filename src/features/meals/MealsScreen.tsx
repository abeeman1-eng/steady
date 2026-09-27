import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Sheet } from '../../components/Sheet'
import { Button, Field, Stepper, inputClass } from '../../components/ui'
import { getLatestBodyWeight } from '../../data/repositories/bodyRepo'
import { deleteEntry, getEntriesForDate, moveEntry, saveMealAsFavorite, updateEntryServings } from '../../data/repositories/mealRepo'
import type { MealEntryRecord } from '../../data/schema'
import { addDays, formatDate, todayISO } from '../../domain/dates'
import { type MealType, MEAL_TYPES, countMissingExtras, formatCalories, formatServings, scaleNutrition, sumNutrition } from '../../domain/nutrition'
import { targetsNeedReview } from '../../domain/targets'
import { useNutritionTargets } from '../../lib/useNutritionTargets'
import { useProfile } from '../../lib/profileContext'
import { IdeasCard } from './Ideas'
import { DailySummary, MacroLine, NutrientPanel } from './NutritionUi'

const entryNutrition = (e: MealEntryRecord) => scaleNutrition(e, e.servings)

export function MealsScreen() {
  const [params, setParams] = useSearchParams()
  const today = todayISO()
  const date = params.get('date') ?? today
  const profile = useProfile()
  const { targets, minor } = useNutritionTargets()
  const entries = useLiveQuery(() => getEntriesForDate(date), [date])
  const latestWeight = useLiveQuery(getLatestBodyWeight)
  const [editing, setEditing] = useState<MealEntryRecord | null>(null)
  const [savingMeal, setSavingMeal] = useState<MealType | null>(null)

  const go = (d: string) => setParams(d === today ? {} : { date: d }, { replace: true })
  const dayLabel = date === today ? 'Today' : date === addDays(today, -1) ? 'Yesterday' : formatDate(date)
  const review = targets && targetsNeedReview(profile.nutritionTargetsBasis?.weightKg, latestWeight?.weightKg)

  return (
    <main className="mx-auto w-full max-w-xl px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-32">
      <header className="mb-6 flex items-end justify-between gap-3">
        <div>
          <p className="mb-1 text-[13px] font-medium text-muted">{formatDate(date, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          <h1 className="text-[28px] leading-tight font-semibold">Food log</h1>
        </div>
        <div className="flex items-center rounded-[14px] bg-surface p-1 ring-1 ring-border ring-inset" role="group" aria-label="Day">
          <button type="button" onClick={() => go(addDays(date, -1))} className="min-h-10 min-w-10 rounded-[10px] text-lg text-muted hover:bg-surface-2 hover:text-text" aria-label="Previous day">
            ‹
          </button>
          <span className="min-w-[5.5rem] text-center text-[14px] font-medium" aria-live="polite">
            {dayLabel}
          </span>
          <button type="button" onClick={() => go(addDays(date, 1))} disabled={date >= today} className="min-h-10 min-w-10 rounded-[10px] text-lg text-muted hover:bg-surface-2 hover:text-text disabled:opacity-25" aria-label="Next day">
            ›
          </button>
        </div>
      </header>

      {entries && (
        <div className="flex flex-col gap-6">
          {review && (
            <Link to="/meals/targets" className="flex items-center justify-between gap-3 rounded-2xl bg-surface-2 px-4 py-3 text-[14px] ring-1 ring-border ring-inset">
              <span>Your weight has changed since you set your targets.</span>
              <span className="shrink-0 font-medium text-accent">Review</span>
            </Link>
          )}

          <DailySummary totals={sumNutrition(entries.map(entryNutrition))} targets={targets} missing={countMissingExtras(entries)} minor={minor} />

          {date === today && <IdeasCard totals={sumNutrition(entries.map(entryNutrition))} targets={targets} diet={profile.dietStyle ?? 'any'} date={date} fiberUnmeasured={countMissingExtras(entries).fiberG > 0} minor={minor} />}

          {MEAL_TYPES.map((m) => {
            const items = entries.filter((e) => e.mealType === m.value)
            const total = sumNutrition(items.map(entryNutrition))
            return (
              <section key={m.value} className="flex flex-col gap-2">
                <div className="flex items-end justify-between gap-2 px-1">
                  <div>
                    <h2 className="text-[17px] font-semibold">{m.label}</h2>
                    {items.length > 0 && <MacroLine n={total} className="mt-0.5" />}
                  </div>
                  {items.length > 0 && (
                    <span className="pb-0.5 text-[15px] font-semibold tabular-nums">
                      {formatCalories(total.calories)} <span className="text-[13px] font-normal text-muted">cal</span>
                    </span>
                  )}
                </div>
                <div className="overflow-hidden rounded-[20px] bg-surface ring-1 ring-border ring-inset">
                  {items.length > 0 && (
                    <ul className="divide-y divide-border">
                      {items.map((e) => {
                        const n = entryNutrition(e)
                        return (
                          <li key={e.id}>
                            <button type="button" onClick={() => setEditing(e)} className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition hover:bg-surface-2">
                              <span className="min-w-0">
                                <span className="block truncate text-[15px]">{e.name}</span>
                                <span className="mt-0.5 block truncate text-[13px] text-subtle">
                                  {formatServings(e.servings)} × {e.servingSize}
                                </span>
                                <MacroLine n={n} className="mt-1" />
                              </span>
                              <span className="shrink-0 pt-0.5 text-[15px] tabular-nums">{formatCalories(n.calories)}</span>
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                  <div className={`flex flex-wrap items-center gap-1 px-2 py-1.5 ${items.length ? 'border-t border-border' : ''}`}>
                    <Link to={`/meals/add?meal=${m.value}&date=${date}`} className="flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-[15px] font-medium text-accent hover:bg-surface-2">
                      <span aria-hidden className="text-lg leading-none">+</span> Add food
                    </Link>
                    {items.length > 1 && (
                      <button type="button" onClick={() => setSavingMeal(m.value)} className="ml-auto min-h-11 rounded-xl px-3 text-[13px] text-muted hover:bg-surface-2 hover:text-text">
                        Save as favorite meal
                      </button>
                    )}
                  </div>
                </div>
              </section>
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
      <div className="flex flex-col gap-5">
        <div>
          <h3 className="text-xl font-semibold">{entry.name}</h3>
          <p className="mt-0.5 text-[13px] text-muted">Serving: {entry.servingSize}</p>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-[15px]">Servings</span>
          <Stepper label="Servings" value={servings} onChange={(v) => setServings(Math.max(0.5, v))} step={0.5} min={0.5} format={formatServings} />
        </div>
        <label className="flex items-center justify-between gap-3">
          <span className="text-[15px]">Meal</span>
          <select value={meal} onChange={(e) => setMeal(e.target.value as MealType)} className="min-h-11 rounded-[14px] bg-surface-2 px-3 text-[15px] ring-1 ring-border ring-inset focus:ring-2 focus:ring-accent focus:outline-none">
            {MEAL_TYPES.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
        <NutrientPanel nutrition={scaleNutrition(entry, servings)} />
        <div className="flex flex-col gap-2">
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
      </div>
    </Sheet>
  )
}

function SaveMealSheet({ suggested, count, onSave, onClose }: { suggested: string; count: number; onSave: (name: string) => void; onClose: () => void }) {
  const [name, setName] = useState(suggested)
  return (
    <Sheet title="Save favorite meal" onClose={onClose}>
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          onSave(name)
        }}
      >
        <p className="text-[14px] text-muted">Saves these {count} foods so you can log them together in one tap from Favorites.</p>
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
