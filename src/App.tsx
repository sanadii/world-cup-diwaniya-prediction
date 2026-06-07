import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { Dashboard } from '@/features/dashboard/Dashboard'

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
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/predict" element={<ComingSoon title="PREDICTIONS" />} />
        <Route path="/matches" element={<ComingSoon title="MATCH CALENDAR" />} />
        <Route path="/matches/:id" element={<ComingSoon title="MATCH DETAIL" />} />
        <Route path="/leaderboard" element={<ComingSoon title="LEADERBOARD" />} />
        <Route path="/tables" element={<ComingSoon title="GROUP TABLES" />} />
        <Route path="/bracket" element={<ComingSoon title="KNOCKOUT BRACKET" />} />
        <Route path="/profile" element={<ComingSoon title="MY PROFILE" />} />
        <Route path="/admin" element={<ComingSoon title="ADMIN PANEL" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
