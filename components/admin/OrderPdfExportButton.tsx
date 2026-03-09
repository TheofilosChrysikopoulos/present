'use client'

import { useState } from 'react'
import { FileDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { OrderPdfData } from '@/lib/pdf/generateOrderPdf'

interface OrderPdfExportButtonProps {
  data: OrderPdfData
  locale: string
}

export function OrderPdfExportButton({ data, locale }: OrderPdfExportButtonProps) {
  const [generating, setGenerating] = useState(false)

  async function handleExport() {
    setGenerating(true)
    try {
      const { generateOrderPdf } = await import('@/lib/pdf/generateOrderPdf')
      const blob = await generateOrderPdf(data, locale)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const label = data.orderNumber ? `order-${data.orderNumber}` : 'enquiry'
      a.download = `present-${label}-${new Date(data.createdAt).toISOString().slice(0, 10)}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('PDF generation failed', err)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={generating}
      className="gap-2"
    >
      <FileDown className="h-4 w-4" />
      {generating ? 'Generating...' : 'Export PDF'}
    </Button>
  )
}
