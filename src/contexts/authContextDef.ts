import { createContext } from 'react'
import type { AuthState, Profile } from '@/hooks/useAuth'

export interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, displayName: string, flagCode: string) => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export type { AuthState, Profile }
