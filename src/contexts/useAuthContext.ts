import { useContext } from 'react'
import { AuthContext, type AuthContextValue } from './authContextDef'

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return ctx
}
