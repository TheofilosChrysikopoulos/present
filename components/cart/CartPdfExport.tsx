'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { FileDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCart } from '@/hooks/useCart'

export function CartPdfExport() {
  const t = useTranslations('cart')
  const locale = useLocale()
  const { items } = useCart()
  const [generating, setGenerating] = useState(false)

  async function handleExport() {
    if (items.length === 0) return
    setGenerating(true)
    try {
      // Dynamic import to avoid SSR issues
      const { generateCartPdf } = await import('@/lib/pdf/generateCartPdf')
      const blob = await generateCartPdf(items, locale)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `epresent-selection-${new Date().toISOString().slice(0, 10)}.pdf`
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
      className="w-full gap-2"
      onClick={handleExport}
      disabled={generating || items.length === 0}
    >
      <FileDown className="h-4 w-4" />
      {generating ? 'Generating...' : t('exportPdf')}
    </Button>
  )
}
