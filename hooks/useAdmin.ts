'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useAdmin() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    async function check() {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        setIsAdmin(false)
        setLoading(false)
        return
      }
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      setIsAdmin(data?.role === 'admin')
      setLoading(false)
    }

    check()
  }, [])

  return { isAdmin, loading }
}
