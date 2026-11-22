import { useLiveQuery } from 'dexie-react-hooks'
import { Suspense, lazy } from 'react'
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { RestTimerBanner, RestTimerHost } from './components/RestTimerHost'
import { TabBar } from './components/TabBar'
import { UpdatePrompt } from './components/UpdatePrompt'
import { getProfile } from './data/repositories/profileRepo'
import { OnboardingScreen } from './features/onboarding/OnboardingScreen'
import { TodayScreen } from './features/today/TodayScreen'
import { ProfileContext } from './lib/profileContext'

// Code-split by page so a first visit on a slow connection downloads only what it needs.
const ExerciseDetailScreen = lazy(() => import('./features/exercises/ExerciseDetailScreen').then((m) => ({ default: m.ExerciseDetailScreen })))
const ExerciseGuideScreen = lazy(() => import('./features/exercises/ExerciseGuideScreen').then((m) => ({ default: m.ExerciseGuideScreen })))
const HistoryScreen = lazy(() => import('./features/history/HistoryScreen').then((m) => ({ default: m.HistoryScreen })))
const WorkoutDetailScreen = lazy(() => import('./features/history/WorkoutDetailScreen').then((m) => ({ default: m.WorkoutDetailScreen })))
const AddFoodScreen = lazy(() => import('./features/meals/AddFoodScreen').then((m) => ({ default: m.AddFoodScreen })))
const HealthScreen = lazy(() => import('./features/meals/HealthScreen').then((m) => ({ default: m.HealthScreen })))
const MealIdeasScreen = lazy(() => import('./features/meals/MealIdeasScreen').then((m) => ({ default: m.MealIdeasScreen })))
const MealsScreen = lazy(() => import('./features/meals/MealsScreen').then((m) => ({ default: m.MealsScreen })))
const PlanBuilderScreen = lazy(() => import('./features/meals/PlanBuilderScreen').then((m) => ({ default: m.PlanBuilderScreen })))
const TargetsScreen = lazy(() => import('./features/meals/TargetsScreen').then((m) => ({ default: m.TargetsScreen })))
const PlanScreen = lazy(() => import('./features/plan/PlanScreen').then((m) => ({ default: m.PlanScreen })))
const ProgressScreen = lazy(() => import('./features/progress/ProgressScreen').then((m) => ({ default: m.ProgressScreen })))
const LogRunScreen = lazy(() => import('./features/running/LogRunScreen').then((m) => ({ default: m.LogRunScreen })))
const FinishScreen = lazy(() => import('./features/session/FinishScreen').then((m) => ({ default: m.FinishScreen })))
const SessionScreen = lazy(() => import('./features/session/SessionScreen').then((m) => ({ default: m.SessionScreen })))
const SettingsScreen = lazy(() => import('./features/settings/SettingsScreen').then((m) => ({ default: m.SettingsScreen })))
const PlanPrintScreen = lazy(() => import('./features/plan/PlanPrintScreen').then((m) => ({ default: m.PlanPrintScreen })))

/** Sends new users to onboarding and provides the profile to everything else. */
function OnboardedGate() {
  const profile = useLiveQuery(getProfile)
  const location = useLocation()
  if (profile === undefined) return null
  if (profile === null) return <Navigate to="/onboarding" replace state={{ from: location.pathname }} />
  return (
    <ProfileContext.Provider value={profile}>
      <RestTimerHost />
      <Outlet />
    </ProfileContext.Provider>
  )
}

function TabLayout() {
  return (
    <>
      <Outlet />
      <RestTimerBanner />
      <TabBar />
    </>
  )
}

export default function App() {
  return (
    <>
      <Suspense fallback={null}>
      <Routes>
        <Route path="/onboarding" element={<OnboardingScreen />} />
        <Route element={<OnboardedGate />}>
          <Route path="/session/:workoutId" element={<SessionScreen />} />
          <Route path="/session/:workoutId/finish" element={<FinishScreen />} />
          <Route path="/runs/log" element={<LogRunScreen />} />
          <Route path="/plan/print" element={<PlanPrintScreen />} />
          <Route element={<TabLayout />}>
            <Route index element={<TodayScreen />} />
            <Route path="/plan" element={<PlanScreen />} />
            <Route path="/meals" element={<MealsScreen />} />
            <Route path="/meals/add" element={<AddFoodScreen />} />
            <Route path="/meals/targets" element={<TargetsScreen />} />
            <Route path="/meals/plan" element={<PlanBuilderScreen />} />
            <Route path="/meals/ideas" element={<MealIdeasScreen />} />
            <Route path="/meals/health" element={<HealthScreen />} />
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
      </Suspense>
      <UpdatePrompt />
    </>
  )
}
