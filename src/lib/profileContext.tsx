import { createContext, useContext } from 'react'
import type { ProfileRecord } from '../data/schema'

export const ProfileContext = createContext<ProfileRecord | null>(null)

/** The onboarded user's profile. Only use below the onboarding gate. */
export function useProfile(): ProfileRecord {
  const profile = useContext(ProfileContext)
  if (!profile) throw new Error('useProfile used outside an onboarded route')
  return profile
}
