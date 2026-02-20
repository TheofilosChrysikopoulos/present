'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { ShoppingCart, Check, Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCart } from '@/hooks/useCart'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { ProductVariantWithImages } from '@/lib/types'

interface AddToCartButtonProps {
  product: {
    id: string
    sku: string
    name_en: string
    name_el: string
    price: number
    moq: number
    product_images?: Array<{ storage_path: string; is_primary: boolean }>
  }
  selectedVariant?: ProductVariantWithImages | null
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

function imgUrl(path: string) {
  return `${SUPABASE_URL}/storage/v1/object/public/product-images/${path}`
}

export function AddToCartButton({
  product,
  selectedVariant,
}: AddToCartButtonProps) {
  const t = useTranslations('product')
  const locale = useLocale()
  const { addItem, isInCart, getItemQty } = useCart()
  const [qty, setQty] = useState(product.moq)
  const [justAdded, setJustAdded] = useState(false)

  const variantId = selectedVariant?.id
  const inCart = isInCart(product.id, variantId)

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

    addItem({
      productId: product.id,
      sku: selectedVariant?.sku_suffix
        ? `${product.sku}${selectedVariant.sku_suffix}`
        : product.sku,
      nameEn: product.name_en,
      nameEl: product.name_el,
      price: product.price,
      moq: product.moq,
      qty,
      variant: variantInfo,
      primaryImagePath:
        variantPrimaryImage?.storage_path ?? primaryImage?.storage_path ?? null,
      variantId,
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
        <label className="text-sm font-medium text-stone-700 mb-1.5 block">
          {t('quantity')}
        </label>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setQty((q) => Math.max(product.moq, q - 1))}
            className="h-9 w-9 rounded-md border border-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-50 transition-colors"
            aria-label="Decrease quantity"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <Input
            type="number"
            min={product.moq}
            value={qty}
            onChange={(e) =>
              setQty(Math.max(product.moq, Number(e.target.value) || product.moq))
            }
            className="w-20 text-center h-9"
          />
          <button
            onClick={() => setQty((q) => q + 1)}
            className="h-9 w-9 rounded-md border border-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-50 transition-colors"
            aria-label="Increase quantity"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          {product.moq > 1 && (
            <span className="text-xs text-stone-400">
              {t('moqNote', { moq: product.moq })}
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
