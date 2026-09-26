import { useLiveQuery } from 'dexie-react-hooks'
import { lazy, Suspense, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Sheet } from '../../components/Sheet'
import { Button, Card, SectionTitle, inputClass } from '../../components/ui'
import { LookupError, lookupBarcodeOnline, searchPackagedOnline, searchUsda, usdaDisplayName, type PackagedResult } from '../../data/foodSources'
import { findFoodByBarcode, listFavoriteFoods, listRecentFoods, listSavedMeals, logSavedMeal, searchMyFoods, deleteSavedMeal } from '../../data/repositories/mealRepo'
import type { FoodRecord } from '../../data/schema'
import { todayISO } from '../../domain/dates'
import { type MealType, MEAL_TYPES, type Nutrition, type UsdaFood, defaultServingIndex, formatCalories, isPlausibleBarcode, mealForTime, nutritionForGrams, usdaPer100g, usdaServingOptions } from '../../domain/nutrition'
import { vibrate } from '../../lib/alerts'
import { FoodConfirmSheet, type FoodCandidate } from './FoodConfirmSheet'
import { ManualFoodSheet } from './ManualFoodSheet'

const BarcodeScanner = lazy(() => import('./BarcodeScanner'))

type Overlay =
  | { kind: 'confirm'; candidate: FoodCandidate }
  | { kind: 'manual'; barcode?: string; name?: string; notice?: string }
  | { kind: 'scan' }
  | { kind: 'typeBarcode' }
  | null

const isMealType = (v: string | null): v is MealType => MEAL_TYPES.some((m) => m.value === v)

export function AddFoodScreen() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const meal: MealType = isMealType(params.get('meal')) ? (params.get('meal') as MealType) : mealForTime()
  const date = params.get('date') ?? todayISO()
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<'recent' | 'favorites'>('recent')
  const [overlay, setOverlay] = useState<Overlay>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const done = () => navigate(`/meals?date=${date}`, { replace: true })

  async function handleBarcode(raw: string) {
    vibrate(80)
    setOverlay(null)
    setStatus(null)
    setBusy(true)
    try {
      const saved = await findFoodByBarcode(raw)
      if (saved) return setOverlay({ kind: 'confirm', candidate: { kind: 'saved', food: saved } })
      const result = await lookupBarcodeOnline(raw)
      if (result.status === 'found' && result.product?.nutrition) {
        return setOverlay({ kind: 'confirm', candidate: { kind: 'product', product: { ...result.product, nutrition: result.product.nutrition }, barcode: raw } })
      }
      setOverlay({
        kind: 'manual',
        barcode: raw,
        name: result.product?.name,
        notice:
          result.status === 'noNutrition'
            ? 'We found this product, but it has no nutrition info. Enter it from the label and we’ll remember it next time.'
            : 'We couldn’t find this barcode. Enter it from the label and we’ll remember it next time you scan it.',
      })
    } catch (e) {
      if (e instanceof LookupError && e.reason === 'offline') {
        setStatus('You’re offline. Items you’ve scanned before work offline, but new products need a connection. You can enter this one manually.')
      } else {
        setStatus('Open Food Facts isn’t responding right now. Try again in a moment, or enter the food manually.')
      }
      setOverlay({ kind: 'manual', barcode: raw })
    } finally {
      setBusy(false)
    }
  }

  const mealLabel = MEAL_TYPES.find((m) => m.value === meal)!.label

  return (
    <main className="mx-auto w-full max-w-xl px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-28">
      <button type="button" onClick={() => navigate(-1)} className="inline-flex min-h-11 items-center text-accent">
        ← Back
      </button>
      <h1 className="text-2xl font-bold">Add to {mealLabel}</h1>
      <div className="mt-2 flex gap-2 overflow-x-auto pb-1" role="radiogroup" aria-label="Meal">
        {MEAL_TYPES.map((m) => (
          <button
            key={m.value}
            type="button"
            role="radio"
            aria-checked={m.value === meal}
            onClick={() => setParams({ meal: m.value, date }, { replace: true })}
            className={`min-h-11 shrink-0 rounded-full px-4 text-sm ${m.value === meal ? 'bg-accent text-accent-ink font-semibold' : 'bg-surface-2 text-text'}`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-4">
        <Button block onClick={() => setOverlay({ kind: 'scan' })} disabled={busy}>
          <BarcodeIcon /> {busy ? 'Looking up…' : 'Scan barcode'}
        </Button>
        {status && (
          <p role="status" className="rounded-xl bg-surface-2 p-3 text-sm">
            {status}
          </p>
        )}

        <input className={inputClass} type="search" enterKeyHint="search" placeholder="Search foods, e.g. banana, oatmeal" aria-label="Search foods" value={query} onChange={(e) => setQuery(e.target.value)} />

        {query.trim() ? (
          <SearchResults query={query.trim()} onPick={(candidate) => setOverlay({ kind: 'confirm', candidate })} />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-surface-2 p-1" role="tablist">
              {(['recent', 'favorites'] as const).map((t) => (
                <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`min-h-11 rounded-lg text-sm ${tab === t ? 'bg-surface font-semibold' : 'text-muted'}`}>
                  {t === 'recent' ? 'Recent' : 'Favorites'}
                </button>
              ))}
            </div>
            {tab === 'recent' ? (
              <RecentList onPick={(food) => setOverlay({ kind: 'confirm', candidate: { kind: 'saved', food } })} />
            ) : (
              <FavoritesList meal={meal} date={date} onLoggedMeal={done} onPick={(food) => setOverlay({ kind: 'confirm', candidate: { kind: 'saved', food } })} />
            )}
          </>
        )}

        <div className="flex flex-col items-center gap-1 pt-2">
          <button type="button" onClick={() => setOverlay({ kind: 'manual' })} className="min-h-11 text-accent">
            Enter a food manually
          </button>
          <button type="button" onClick={() => setOverlay({ kind: 'typeBarcode' })} className="min-h-11 text-accent">
            Type a barcode instead
          </button>
        </div>
        <p className="text-center text-xs text-muted">
          Whole foods from USDA FoodData Central. Packaged foods from{' '}
          <a href="https://world.openfoodfacts.org" target="_blank" rel="noreferrer" className="underline">
            Open Food Facts
          </a>{' '}
          (ODbL).
        </p>
      </div>

      {overlay?.kind === 'confirm' && <FoodConfirmSheet candidate={overlay.candidate} mealType={meal} date={date} onDone={done} onClose={() => setOverlay(null)} />}
      {overlay?.kind === 'manual' && (
        <ManualFoodSheet mealType={meal} date={date} barcode={overlay.barcode} initialName={overlay.name} notice={overlay.notice} onDone={done} onClose={() => setOverlay(null)} />
      )}
      {overlay?.kind === 'scan' && (
        <Suspense fallback={null}>
          <BarcodeScanner onDetected={handleBarcode} onTypeInstead={() => setOverlay({ kind: 'typeBarcode' })} onClose={() => setOverlay(null)} />
        </Suspense>
      )}
      {overlay?.kind === 'typeBarcode' && <TypeBarcodeSheet onSubmit={handleBarcode} onClose={() => setOverlay(null)} />}
    </main>
  )
}

function SearchResults({ query, onPick }: { query: string; onPick: (c: FoodCandidate) => void }) {
  const mine = useLiveQuery(() => searchMyFoods(query), [query])
  const [usda, setUsda] = useState<UsdaFood[] | null>(null)
  const [usdaError, setUsdaError] = useState(false)
  // Tagged with its query so typing something new shows the search button again without an effect.
  const [packagedState, setPackagedState] = useState<{ query: string; state: 'idle' | 'loading' | 'error'; results: PackagedResult[]; message?: string } | null>(null)
  const packaged = packagedState?.query === query ? packagedState : { state: 'idle' as const, results: [] as PackagedResult[], message: undefined }

  useEffect(() => {
    let current = true
    const t = setTimeout(() => {
      searchUsda(query)
        .then((r) => current && (setUsda(r), setUsdaError(false)))
        .catch(() => current && setUsdaError(true))
    }, 120)
    return () => {
      current = false
      clearTimeout(t)
    }
  }, [query])

  async function searchPackaged() {
    setPackagedState({ query, state: 'loading', results: [] })
    try {
      const results = await searchPackagedOnline(query)
      setPackagedState({ query, state: 'idle', results, message: results.length ? undefined : 'No packaged foods found. Try scanning the barcode.' })
    } catch (e) {
      setPackagedState({
        query,
        state: 'error',
        results: [],
        message: e instanceof LookupError && e.reason === 'offline' ? 'You’re offline. Packaged food search needs a connection.' : 'Packaged food search isn’t available right now. Scanning the barcode usually still works.',
      })
    }
  }

  return (
    <div className="flex flex-col gap-4" aria-live="polite">
      {mine && mine.length > 0 && (
        <section className="flex flex-col gap-2">
          <SectionTitle>Your foods</SectionTitle>
          <FoodList items={mine.map((f) => ({ key: f.id, name: f.name, detail: f.servingSize, calories: f.calories, star: f.isFavorite, onClick: () => onPick({ kind: 'saved', food: f }) }))} />
        </section>
      )}

      <section className="flex flex-col gap-2">
        <SectionTitle>Whole foods</SectionTitle>
        {usdaError ? (
          <p className="text-sm text-muted">The food list couldn’t load. Check your connection and try again.</p>
        ) : usda === null ? (
          <p className="text-sm text-muted">Searching…</p>
        ) : usda.length === 0 ? (
          <p className="text-sm text-muted">No matches. Try a simpler word, like “chicken” or “yogurt”.</p>
        ) : (
          <FoodList
            items={usda.map((f) => {
              const options = usdaServingOptions(f)
              const serving = options[defaultServingIndex(options)]
              return { key: String(f[0]), name: usdaDisplayName(f), detail: serving.label, calories: nutritionForGrams(usdaPer100g(f), serving.grams).calories, onClick: () => onPick({ kind: 'usda', food: f }) }
            })}
          />
        )}
      </section>

      <section className="flex flex-col gap-2">
        <SectionTitle>Packaged foods</SectionTitle>
        {packaged.results.length > 0 && (
          <FoodList
            items={packaged.results.map((p) => ({
              key: p.barcode,
              name: p.name,
              detail: p.servingSize,
              calories: p.nutrition!.calories,
              onClick: () => onPick({ kind: 'product', product: { ...p, nutrition: p.nutrition as Nutrition }, barcode: p.barcode }),
            }))}
          />
        )}
        {packaged.message && <p className="text-sm text-muted">{packaged.message}</p>}
        {packaged.results.length === 0 && (
          <Button variant="secondary" onClick={searchPackaged} disabled={packaged.state === 'loading'}>
            {packaged.state === 'loading' ? 'Searching Open Food Facts…' : `Search packaged foods for “${query}”`}
          </Button>
        )}
      </section>
    </div>
  )
}

function RecentList({ onPick }: { onPick: (f: FoodRecord) => void }) {
  const recent = useLiveQuery(() => listRecentFoods())
  if (!recent) return null
  if (recent.length === 0) return <Card><p className="text-muted">Foods you log will appear here for one-tap re-logging.</p></Card>
  return <FoodList items={recent.map((f) => ({ key: f.id, name: f.name, detail: f.servingSize, calories: f.calories, star: f.isFavorite, onClick: () => onPick(f) }))} />
}

function FavoritesList({ meal, date, onPick, onLoggedMeal }: { meal: MealType; date: string; onPick: (f: FoodRecord) => void; onLoggedMeal: () => void }) {
  const foods = useLiveQuery(listFavoriteFoods)
  const meals = useLiveQuery(listSavedMeals)
  if (!foods || !meals) return null
  if (foods.length === 0 && meals.length === 0) {
    return <Card><p className="text-muted">Tap the ☆ when adding a food to save it here. You can also save a whole meal from your food log.</p></Card>
  }
  return (
    <div className="flex flex-col gap-4">
      {meals.length > 0 && (
        <section className="flex flex-col gap-2">
          <SectionTitle>Meals</SectionTitle>
          <ul className="flex flex-col gap-2">
            {meals.map((m) => (
              <li key={m.id} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    await logSavedMeal(m.id, date, meal)
                    onLoggedMeal()
                  }}
                  className="flex min-h-14 flex-1 flex-col justify-center rounded-xl border border-border bg-surface px-4 py-2 text-left hover:bg-surface-2"
                >
                  <span className="font-medium">{m.name}</span>
                  <span className="text-sm text-muted">
                    {m.items.length} {m.items.length === 1 ? 'food' : 'foods'} · tap to add all
                  </span>
                </button>
                <button type="button" onClick={() => confirm(`Delete the favorite meal “${m.name}”?`) && deleteSavedMeal(m.id)} className="min-h-11 min-w-11 rounded-xl text-muted hover:bg-surface-2" aria-label={`Delete ${m.name}`}>
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
      {foods.length > 0 && (
        <section className="flex flex-col gap-2">
          <SectionTitle>Foods</SectionTitle>
          <FoodList items={foods.map((f) => ({ key: f.id, name: f.name, detail: f.servingSize, calories: f.calories, star: true, onClick: () => onPick(f) }))} />
        </section>
      )}
    </div>
  )
}

function FoodList({ items }: { items: { key: string; name: string; detail: string; calories: number; star?: boolean; onClick: () => void }[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((i) => (
        <li key={i.key}>
          <button type="button" onClick={i.onClick} className="flex min-h-14 w-full items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-2 text-left hover:bg-surface-2">
            <span className="min-w-0">
              <span className="block truncate font-medium">
                {i.star && <span className="mr-1 text-gold" aria-label="Favorite">★</span>}
                {i.name}
              </span>
              <span className="block truncate text-sm text-muted">{i.detail}</span>
            </span>
            <span className="shrink-0 text-sm tabular-nums text-muted">{formatCalories(i.calories)} cal</span>
          </button>
        </li>
      ))}
    </ul>
  )
}

function TypeBarcodeSheet({ onSubmit, onClose }: { onSubmit: (code: string) => void; onClose: () => void }) {
  const [code, setCode] = useState('')
  const valid = isPlausibleBarcode(code)
  return (
    <Sheet title="Type barcode" onClose={onClose}>
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault()
          if (valid) onSubmit(code.replace(/\D/g, ''))
        }}
      >
        <p className="text-sm text-muted">Enter the numbers under the barcode (8, 12 or 13 digits).</p>
        <input className={inputClass} inputMode="numeric" autoComplete="off" aria-label="Barcode number" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. 0123456789012" />
        <Button type="submit" block disabled={!valid}>
          Look up
        </Button>
      </form>
    </Sheet>
  )
}

function BarcodeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="size-5" aria-hidden>
      <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 8v8M10 8v8M13 8v8M17 8v8" />
    </svg>
  )
}
