'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { ShoppingCart, Check, Minus, Plus, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCart } from '@/hooks/useCart'
import { useUser } from '@/hooks/useUser'
import { useAuthModal } from '@/lib/auth/authModalContext'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { ProductVariantWithImages, ProductSize } from '@/lib/types'

interface AddToCartButtonProps {
  product: {
    id: string
    sku: string
    name_en: string
    name_el: string
    price: number
    discount_price?: number | null
    moq: number
    product_images?: Array<{ storage_path: string; is_primary: boolean }>
  }
  selectedVariant?: ProductVariantWithImages | null
  selectedSize?: ProductSize | null
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

function imgUrl(path: string) {
  return `${SUPABASE_URL}/storage/v1/object/public/product-images/${path}`
}

export function AddToCartButton({
  product,
  selectedVariant,
  selectedSize,
}: AddToCartButtonProps) {
  const t = useTranslations('product')
  const tAuth = useTranslations('auth')
  const locale = useLocale()
  const base = `/${locale}`
  const { addItem, isInCart, getItemQty } = useCart()
  const { isApproved, isAuthenticated, loading: userLoading } = useUser()
  const { openLogin, openRegister } = useAuthModal()
  const moq = product.moq
  const [qty, setQty] = useState(moq)
  const [inputValue, setInputValue] = useState(String(moq))
  const [justAdded, setJustAdded] = useState(false)

  /** Round up to nearest MOQ multiple (minimum = moq) */
  function roundUpToMoq(value: number): number {
    if (value <= moq) return moq
    return Math.ceil(value / moq) * moq
  }

  // If user is not authenticated, show login/register prompt
  if (!userLoading && !isAuthenticated) {
    return (
      <div className="space-y-3">
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center">
          <Lock className="h-5 w-5 text-slate-400 mx-auto mb-2" />
          <p className="text-sm text-slate-600 mb-3">
            {tAuth('loginToOrder')}
          </p>
          <div className="flex gap-2 justify-center">
            <Button size="sm" variant="outline" onClick={openLogin}>{tAuth('loginLink')}</Button>
            <Button size="sm" onClick={openRegister}>{tAuth('registerLink')}</Button>
          </div>
        </div>
      </div>
    )
  }

  // If user is authenticated but not approved (pending), show pending message
  if (!userLoading && !isApproved) {
    return (
      <div className="space-y-3">
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-center">
          <Lock className="h-5 w-5 text-amber-500 mx-auto mb-2" />
          <p className="text-sm text-amber-700">
            {tAuth('pendingApproval')}
          </p>
        </div>
      </div>
    )
  }

  const variantId = selectedVariant?.id
  const sizeId = selectedSize?.id
  const inCart = isInCart(product.id, variantId, sizeId)

  const primaryImage =
    product.product_images?.find((img) => img.is_primary) ??
    product.product_images?.[0]

  const variantPrimaryImage =
    selectedVariant?.variant_images?.find((i) => i.is_primary) ??
    selectedVariant?.variant_images?.[0]

  function handleAdd() {
    const variantInfo = selectedVariant
      ? {
          id: selectedVariant.id,
          skuSuffix: selectedVariant.sku_suffix,
          colorNameEn: selectedVariant.color_name_en,
          colorNameEl: selectedVariant.color_name_el,
          hexColor: selectedVariant.hex_color,
          type: selectedVariant.variant_type as 'swatch' | 'image',
          primaryImagePath:
            variantPrimaryImage?.storage_path ?? null,
        }
      : null

    const sizeInfo = selectedSize
      ? {
          id: selectedSize.id,
          labelEn: selectedSize.label_en,
          labelEl: selectedSize.label_el,
          skuSuffix: selectedSize.sku_suffix,
        }
      : null

    let sku = product.sku
    if (selectedVariant?.sku_suffix) sku += selectedVariant.sku_suffix
    if (selectedSize?.sku_suffix) sku += ` ${selectedSize.sku_suffix}`

    // Use size-specific pricing when available, otherwise product-level pricing
    const effectivePrice = selectedSize?.price ?? product.price
    const effectiveDiscountPrice = selectedSize ? selectedSize.discount_price : (product.discount_price ?? null)

    addItem({
      productId: product.id,
      sku,
      nameEn: product.name_en,
      nameEl: product.name_el,
      price: effectivePrice,
      discountPrice: effectiveDiscountPrice ?? null,
      moq: product.moq,
      qty,
      variant: variantInfo,
      size: sizeInfo,
      primaryImagePath:
        variantPrimaryImage?.storage_path ?? primaryImage?.storage_path ?? null,
      variantId,
      sizeId,
    })

    setJustAdded(true)
    const name = locale === 'el' ? product.name_el : product.name_en
    toast.success(t('addedToCart'), { description: name })
    setTimeout(() => setJustAdded(false), 2000)
  }

  return (
    <div className="space-y-3">
      {/* Quantity selector */}
      <div>
        <label className="text-sm font-medium text-slate-700 mb-1.5 block">
          {t('quantity')}
        </label>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const next = roundUpToMoq(Math.max(moq, qty - moq))
              setQty(next)
              setInputValue(String(next))
            }}
            className="h-9 w-9 rounded-md border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors"
            aria-label="Decrease quantity"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <input
            type="text"
            inputMode="numeric"
            value={inputValue}
            onChange={(e) => {
              const raw = e.target.value.replace(/[^0-9]/g, '')
              setInputValue(raw)
              const num = parseInt(raw, 10)
              if (!isNaN(num) && num >= moq) {
                setQty(num)
              }
            }}
            onBlur={() => {
              const num = parseInt(inputValue, 10)
              const rounded = roundUpToMoq(isNaN(num) || num < moq ? moq : num)
              setQty(rounded)
              setInputValue(String(rounded))
            }}
            onClick={(e) => {
              ;(e.target as HTMLInputElement).select()
            }}
            className="w-20 text-center h-9 rounded-md border border-slate-200 outline-none bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <button
            onClick={() => {
              const next = qty + moq
              setQty(next)
              setInputValue(String(next))
            }}
            className="h-9 w-9 rounded-md border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors"
            aria-label="Increase quantity"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          {moq > 1 && (
            <span className="text-xs text-slate-400">
              {t('moqNote', { moq: moq })}
            </span>
          )}
        </div>
      </div>

      {/* Add to cart button */}
      <Button
        onClick={handleAdd}
        size="lg"
        className={cn(
          'w-full gap-2 transition-all',
          justAdded && 'bg-green-600 hover:bg-green-700'
        )}
      >
        {justAdded ? (
          <>
            <Check className="h-4 w-4" />
            {t('addedToCart')}
          </>
        ) : (
          <>
            <ShoppingCart className="h-4 w-4" />
            {inCart ? t('addedToCart') : t('addToCart')}
          </>
        )}
      </Button>
    </div>
  )
}
