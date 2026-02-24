'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Customer } from '@/lib/types'

interface UserContextValue {
  customer: Customer | null
  loading: boolean
  isAuthenticated: boolean
  isApproved: boolean
  refresh: () => Promise<void>
  logout: () => Promise<void>
}

const UserContext = createContext<UserContextValue | null>(null)

export function UserProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchCustomer = useCallback(async () => {
    try {
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        setCustomer(null)
        setLoading(false)
        return
      }

      // Fetch customer via API route (uses admin client, bypasses RLS)
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        setCustomer(data.customer ?? null)
      } else {
        setCustomer(null)
      }
    } catch {
      setCustomer(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCustomer()

    const supabase = createClient()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setCustomer(null)
      } else {
        fetchCustomer()
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchCustomer])

  const logout = useCallback(async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setCustomer(null)
  }, [])

  const isAuthenticated = !!customer
  const isApproved = customer?.status === 'approved'

  return (
    <UserContext.Provider
      value={{
        customer,
        loading,
        isAuthenticated,
        isApproved,
        refresh: fetchCustomer,
        logout,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used within UserProvider')
  return ctx
}
