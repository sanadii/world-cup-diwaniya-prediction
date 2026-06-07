import type { ReactNode } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHourglass, faSpinner, faArrowRightFromBracket } from '@fortawesome/free-solid-svg-icons'
import { useAuthContext } from '@/contexts/useAuthContext'

interface Props {
  children?: ReactNode
  requireAdmin?: boolean
}

function PendingApprovalScreen() {
  const { signOut } = useAuthContext()

  return (
    <div className="min-h-screen bg-pitch-950 turf-overlay flex items-center justify-center px-4">
      <div className="fixed top-0 left-0 right-0 h-96 bg-stadium-glow pointer-events-none z-0" />
      <div className="relative z-10 w-full max-w-md mx-auto text-center">
        <div className="glass-card rounded-2xl p-10 flex flex-col items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gold-400/10 border border-gold-400/30 flex items-center justify-center">
            <FontAwesomeIcon icon={faHourglass} className="text-gold-400 text-2xl" />
          </div>
          <div>
            <h2 className="font-display text-4xl tracking-wider text-white leading-none mb-2">
              AWAITING APPROVAL
            </h2>
            <p className="font-body text-sm text-[#8BA898] leading-relaxed max-w-sm">
              Your account is pending admin approval. You'll receive access once an admin reviews
              your registration.
            </p>
          </div>
          <button
            onClick={() => signOut()}
            className="flex items-center gap-2 font-body text-sm text-[#8BA898] hover:text-gold-400 transition-colors mt-2"
          >
            <FontAwesomeIcon icon={faArrowRightFromBracket} className="text-xs" />
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-pitch-950 flex items-center justify-center">
      <FontAwesomeIcon icon={faSpinner} className="fa-spin text-gold-400 text-3xl" />
    </div>
  )
}

export function ProtectedRoute({ children, requireAdmin = false }: Props) {
  const { user, isApproved, isAdmin, isLoading } = useAuthContext()

  if (isLoading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  if (!isApproved && !isAdmin) return <PendingApprovalScreen />
  if (requireAdmin && !isAdmin) return <Navigate to="/" replace />

  // If children are provided, render them (used as layout wrapper in react-router)
  // Otherwise render Outlet for use as a layout route element
  return <>{children ?? <Outlet />}</>
}
