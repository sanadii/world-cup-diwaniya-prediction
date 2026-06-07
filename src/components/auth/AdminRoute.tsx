import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSpinner } from '@fortawesome/free-solid-svg-icons'
import { useAuthContext } from '@/contexts/useAuthContext'

interface Props {
  children: ReactNode
}

export function AdminRoute({ children }: Props) {
  const { user, isAdmin, isLoading } = useAuthContext()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-pitch-950 flex items-center justify-center">
        <FontAwesomeIcon icon={faSpinner} className="fa-spin text-gold-400 text-3xl" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/" replace />

  return <>{children}</>
}
