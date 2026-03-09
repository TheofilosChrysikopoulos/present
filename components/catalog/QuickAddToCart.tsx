'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { ShoppingCart, Check, Minus, Plus } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { useUser } from '@/hooks/useUser'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface QuickAddToCartProps {
  product: {
    id: string
    sku: string
    name_en: string
    name_el: string
    price: number
    moq: number
    product_images?: Array<{ storage_path: string; is_primary: boolean }>
  }
}

export function QuickAddToCart({ product }: QuickAddToCartProps) {
  const t = useTranslations('product')
  const locale = useLocale()
  const { addItem } = useCart()
  const { isApproved, loading: userLoading } = useUser()
  const moq = product.moq
  const [qty, setQty] = useState(moq)
  const [inputValue, setInputValue] = useState(String(moq))
  const [justAdded, setJustAdded] = useState(false)

  // Only show for approved users
  if (userLoading || !isApproved) {
    return null
  }

  const primaryImage =
    product.product_images?.find((img) => img.is_primary) ??
    product.product_images?.[0]

  /** Round up to nearest MOQ multiple (minimum = moq) */
  function roundUpToMoq(value: number): number {
    if (value <= moq) return moq
    return Math.ceil(value / moq) * moq
  }

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    addItem({
      productId: product.id,
      sku: product.sku,
      nameEn: product.name_en,
      nameEl: product.name_el,
      price: product.price,
      moq: product.moq,
      qty,
      variant: null,
      size: null,
      primaryImagePath: primaryImage?.storage_path ?? null,
      variantId: undefined,
      sizeId: undefined,
    })

    setJustAdded(true)
    const name = locale === 'el' ? product.name_el : product.name_en
    toast.success(t('addedToCart'), { description: name })
    setTimeout(() => {
      setJustAdded(false)
      setQty(moq)
      setInputValue(String(moq))
    }, 1500)
  }

  return (
    <div
      className="flex items-end justify-between gap-1.5"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
    >
      {/* Quantity controls — bottom left */}
      <div className="flex items-center border border-slate-200 rounded-md h-7 overflow-hidden">
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            const next = roundUpToMoq(Math.max(moq, qty - moq))
            setQty(next)
            setInputValue(String(next))
          }}
          className="h-full w-6 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors"
          aria-label="Decrease"
        >
          <Minus className="h-3 w-3" />
        </button>
        <input
          type="text"
          inputMode="numeric"
          value={inputValue}
          onChange={(e) => {
            e.stopPropagation()
            // Allow clearing and free typing — only digits
            const raw = e.target.value.replace(/[^0-9]/g, '')
            setInputValue(raw)
            // Update qty live if valid
            const num = parseInt(raw, 10)
            if (!isNaN(num) && num >= moq) {
              setQty(num)
            }
          }}
          onBlur={() => {
            // Round up to nearest MOQ multiple on blur
            const num = parseInt(inputValue, 10)
            const rounded = roundUpToMoq(isNaN(num) || num < moq ? moq : num)
            setQty(rounded)
            setInputValue(String(rounded))
          }}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            // Select all text for easy overwrite
            ;(e.target as HTMLInputElement).select()
          }}
          className="w-10 text-center h-full border-0 border-x border-slate-200 text-xs p-0 outline-none bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            const next = qty + moq
            setQty(next)
            setInputValue(String(next))
          }}
          className="h-full w-6 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors"
          aria-label="Increase"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>

      {/* Cart icon button — bottom right */}
      <button
        onClick={handleAdd}
        className={cn(
          'h-7 w-7 rounded-md flex items-center justify-center transition-all flex-shrink-0',
          justAdded
            ? 'bg-green-600 text-white'
            : 'bg-[#1e3a5f] text-white hover:bg-[#1e3a5f]/80'
        )}
        aria-label={t('addToCart')}
      >
        {justAdded ? (
          <Check className="h-3.5 w-3.5" />
        ) : (
          <ShoppingCart className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  )
}
