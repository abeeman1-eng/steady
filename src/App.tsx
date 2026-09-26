import { useLiveQuery } from 'dexie-react-hooks'
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { TabBar } from './components/TabBar'
import { UpdatePrompt } from './components/UpdatePrompt'
import { getProfile } from './data/repositories/profileRepo'
import { ExerciseDetailScreen } from './features/exercises/ExerciseDetailScreen'
import { ExerciseGuideScreen } from './features/exercises/ExerciseGuideScreen'
import { HistoryScreen } from './features/history/HistoryScreen'
import { WorkoutDetailScreen } from './features/history/WorkoutDetailScreen'
import { AddFoodScreen } from './features/meals/AddFoodScreen'
import { MealsScreen } from './features/meals/MealsScreen'
import { OnboardingScreen } from './features/onboarding/OnboardingScreen'
import { PlanScreen } from './features/plan/PlanScreen'
import { ProgressScreen } from './features/progress/ProgressScreen'
import { FinishScreen } from './features/session/FinishScreen'
import { SessionScreen } from './features/session/SessionScreen'
import { SettingsScreen } from './features/settings/SettingsScreen'
import { TodayScreen } from './features/today/TodayScreen'
import { ProfileContext } from './lib/profileContext'

/** Sends new users to onboarding and provides the profile to everything else. */
function OnboardedGate() {
  const profile = useLiveQuery(getProfile)
  const location = useLocation()
  if (profile === undefined) return null
  if (profile === null) return <Navigate to="/onboarding" replace state={{ from: location.pathname }} />
  return (
    <ProfileContext.Provider value={profile}>
      <Outlet />
    </ProfileContext.Provider>
  )
}

function TabLayout() {
  return (
    <>
      <Outlet />
      <TabBar />
    </>
  )
}

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/onboarding" element={<OnboardingScreen />} />
        <Route element={<OnboardedGate />}>
          <Route path="/session/:workoutId" element={<SessionScreen />} />
          <Route path="/session/:workoutId/finish" element={<FinishScreen />} />
          <Route element={<TabLayout />}>
            <Route index element={<TodayScreen />} />
            <Route path="/plan" element={<PlanScreen />} />
            <Route path="/meals" element={<MealsScreen />} />
            <Route path="/meals/add" element={<AddFoodScreen />} />
            <Route path="/exercises" element={<ExerciseGuideScreen />} />
            <Route path="/exercises/:exerciseId" element={<ExerciseDetailScreen />} />
            <Route path="/history" element={<HistoryScreen />} />
            <Route path="/history/:workoutId" element={<WorkoutDetailScreen />} />
            <Route path="/progress" element={<ProgressScreen />} />
            <Route path="/settings" element={<SettingsScreen />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <UpdatePrompt />
    </>
  )
}
