import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { Dashboard } from '@/features/dashboard/Dashboard'
import { LoginPage } from '@/features/auth/LoginPage'
import { RegisterPage } from '@/features/auth/RegisterPage'
import { ForgotPasswordPage } from '@/features/auth/ForgotPasswordPage'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AdminRoute } from '@/components/auth/AdminRoute'
import { PredictionPage } from '@/features/predict/PredictionPage'
import { LeaderboardPage } from '@/features/leaderboard/LeaderboardPage'
import { ProfilePage } from '@/features/profile/ProfilePage'
import { AdminPanel } from '@/features/admin/AdminPanel'
import { MatchDetailPage } from '@/features/matches/MatchDetailPage'
import { TournamentPage } from '@/features/tournament/TournamentPage'

export default function App() {
  return (
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
  )
}
