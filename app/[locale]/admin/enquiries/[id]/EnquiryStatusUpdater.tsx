'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Enquiry } from '@/lib/types'

interface EnquiryStatusUpdaterProps {
  id: string
  currentStatus: Enquiry['status']
}

const STATUS_ACTIONS: Array<{ label: string; status: Enquiry['status'] }> = [
  { label: 'Mark as Read', status: 'read' },
  { label: 'Mark as Replied', status: 'replied' },
  { label: 'Archive', status: 'archived' },
  { label: 'Reopen', status: 'new' },
]

export function EnquiryStatusUpdater({
  id,
  currentStatus,
}: EnquiryStatusUpdaterProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function updateStatus(status: Enquiry['status']) {
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('enquiries')
        .update({ status })
        .eq('id', id)
      if (error) throw error
      toast.success(`Status updated to ${status}`)
      router.refresh()
    } catch {
      toast.error('Failed to update status')
    } finally {
      setLoading(false)
    }
  }

  const actions = STATUS_ACTIONS.filter((a) => a.status !== currentStatus)

  return (
    <div className="flex flex-col gap-2">
      {actions.map((action) => (
        <Button
          key={action.status}
          variant="outline"
          size="sm"
          onClick={() => updateStatus(action.status)}
          disabled={loading}
        >
          {action.label}
        </Button>
      ))}
    </div>
  )
}
