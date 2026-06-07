import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { Dashboard } from '@/features/dashboard/Dashboard'
import { LoginPage } from '@/features/auth/LoginPage'
import { RegisterPage } from '@/features/auth/RegisterPage'
import { ForgotPasswordPage } from '@/features/auth/ForgotPasswordPage'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AdminRoute } from '@/components/auth/AdminRoute'
import { PredictionPage } from '@/features/predict/PredictionPage'
import { MatchCalendarPage } from '@/features/matches/MatchCalendarPage'
import { LeaderboardPage } from '@/features/leaderboard/LeaderboardPage'
import { ProfilePage } from '@/features/profile/ProfilePage'
import { AdminPanel } from '@/features/admin/AdminPanel'
import { MatchDetailPage } from '@/features/matches/MatchDetailPage'

// Placeholder pages for future screens
function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
      <div className="font-display text-5xl text-white tracking-wider">{title}</div>
      <div className="text-[#4A6458] font-body">Coming soon · Under construction</div>
    </div>
  )
}

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
        <Route path="/predict/:matchId" element={<PredictionPage />} />
        <Route path="/matches" element={<MatchCalendarPage />} />
        <Route path="/matches/:id" element={<MatchDetailPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/tables" element={<ComingSoon title="GROUP TABLES" />} />
        <Route path="/bracket" element={<ComingSoon title="KNOCKOUT BRACKET" />} />
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
