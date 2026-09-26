import { useEffect, useState } from 'react'
import { loadUsdaLookup } from '../../data/foodSources'
import type { Per100 } from '../../domain/mealPlanner'
import type { UsdaFood } from '../../domain/nutrition'

/** Loads the USDA lookup once; null while loading or if it fails. */
export function useUsdaLookup() {
  const [lookup, setLookup] = useState<{ per100: Per100; byId: Map<number, UsdaFood> } | null>(null)
  useEffect(() => {
    let live = true
    loadUsdaLookup()
      .then((l) => live && setLookup(l))
      .catch(() => {})
    return () => {
      live = false
    }
  }, [])
  return lookup
}
