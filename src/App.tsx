import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { Dashboard } from '@/features/dashboard/Dashboard'
import { LoginPage } from '@/features/auth/LoginPage'
import { RegisterPage } from '@/features/auth/RegisterPage'
import { ForgotPasswordPage } from '@/features/auth/ForgotPasswordPage'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AdminRoute } from '@/components/auth/AdminRoute'
import { PredictionPage } from '@/features/predict/PredictionPage'
import { MatchDetailPage } from '@/features/matches/MatchDetailPage'

// Lazy-load heavy routes that aren't on the critical path
const LeaderboardPage = lazy(() =>
  import('@/features/leaderboard/LeaderboardPage').then((m) => ({ default: m.LeaderboardPage })),
)
const ProfilePage = lazy(() =>
  import('@/features/profile/ProfilePage').then((m) => ({ default: m.ProfilePage })),
)
const AdminPanel = lazy(() =>
  import('@/features/admin/AdminPanel').then((m) => ({ default: m.AdminPanel })),
)
const TournamentPage = lazy(() =>
  import('@/features/tournament/TournamentPage').then((m) => ({ default: m.TournamentPage })),
)

export default function App() {
  return (
    <Suspense fallback={null}>
      <Routes>
        {/* Public auth routes — full-screen layouts */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* Protected routes — wrapped in Layout */}
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/predict" element={<Navigate to="/matches" replace />} />
          <Route path="/predict/:matchId" element={<PredictionPage />} />
          <Route path="/matches" element={<TournamentPage />} />
          <Route path="/matches/:id" element={<MatchDetailPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/tables" element={<Navigate to="/matches?tab=groups" replace />} />
          <Route path="/bracket" element={<Navigate to="/matches?tab=bracket" replace />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminPanel />
              </AdminRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
