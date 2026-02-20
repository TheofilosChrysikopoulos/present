'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface AdminDeleteProductProps {
  productId: string
  productName: string
}

export function AdminDeleteProduct({ productId, productName }: AdminDeleteProductProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('products').delete().eq('id', productId)
      if (error) throw error
      toast.success('Product deleted')
      setOpen(false)
      router.refresh()
    } catch {
      toast.error('Failed to delete product')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-stone-400 hover:text-red-500"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Delete Product"
        description={`Are you sure you want to delete "${productName}"? This cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDelete}
        loading={loading}
        destructive
      />
    </>
  )
}
