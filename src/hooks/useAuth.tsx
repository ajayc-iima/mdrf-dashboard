'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User } from 'firebase/auth'
import { onAuthChange } from '@/lib/auth'
import { getUserProfile } from '@/lib/firestore'
import type { UserProfile } from '@/types'

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  refreshProfile: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshProfile = async () => {
    if (user) {
      try {
        const p = await getUserProfile(user.uid)
        setProfile(p)
      } catch (e) {
        console.error("Failed to refresh profile", e)
      }
    }
  }

  useEffect(() => {
    const unsub = onAuthChange(async (firebaseUser) => {
      setUser(firebaseUser)
      try {
        if (firebaseUser) {
          const p = await getUserProfile(firebaseUser.uid)
          setProfile(p)
        } else {
          setProfile(null)
        }
      } catch (e) {
        console.error("Failed to load user profile", e)
      } finally {
        setLoading(false)
      }
    })
    return unsub
  }, [])

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
