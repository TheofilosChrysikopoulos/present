'use client'

import { useState } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ImageUploader, type UploadedImage } from './ImageUploader'
import { cn } from '@/lib/utils'

export interface SizeData {
  id?: string
  label_en: string
  label_el: string
  sku_suffix: string
  sort_order: number
}

export interface VariantData {
  id?: string
  sku_suffix: string
  color_name_en: string
  color_name_el: string
  hex_color: string
  variant_type: 'swatch' | 'image'
  is_primary: boolean
  sort_order: number
  images: UploadedImage[]
  sizes: SizeData[]
}

interface VariantEditorProps {
  variants: VariantData[]
  onChange: (variants: VariantData[]) => void
  productId: string
}

const emptyVariant = (): VariantData => ({
  sku_suffix: '',
  color_name_en: '',
  color_name_el: '',
  hex_color: '#e7e5e4',
  variant_type: 'image',
  is_primary: false,
  sort_order: 0,
  images: [],
  sizes: [],
})

const emptySize = (): SizeData => ({
  label_en: '',
  label_el: '',
  sku_suffix: '',
  sort_order: 0,
})

export function VariantEditor({
  variants,
  onChange,
  productId,
}: VariantEditorProps) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(
    variants.length > 0 ? 0 : null
  )

  function addVariant() {
    const isFirst = variants.length === 0
    const newVariant = { ...emptyVariant(), sort_order: variants.length, is_primary: isFirst }
    onChange([...variants, newVariant])
    setExpandedIdx(variants.length)
  }

  function removeVariant(index: number) {
    const removed = variants[index]
    const updated = variants.filter((_, i) => i !== index)
    // If removed variant was primary, make the first one primary
    if (removed.is_primary && updated.length > 0) {
      updated[0] = { ...updated[0], is_primary: true }
    }
    onChange(updated)
    setExpandedIdx(null)
  }

  function updateVariant(index: number, updates: Partial<VariantData>) {
    onChange(variants.map((v, i) => (i === index ? { ...v, ...updates } : v)))
  }

  function setPrimary(index: number) {
    onChange(
      variants.map((v, i) => ({ ...v, is_primary: i === index }))
    )
  }

  // Size helpers scoped to a variant
  function addSize(variantIdx: number) {
    const v = variants[variantIdx]
    updateVariant(variantIdx, {
      sizes: [...v.sizes, { ...emptySize(), sort_order: v.sizes.length }],
    })
  }

  function removeSize(variantIdx: number, sizeIdx: number) {
    const v = variants[variantIdx]
    updateVariant(variantIdx, {
      sizes: v.sizes.filter((_, i) => i !== sizeIdx),
    })
  }

  function updateSize(variantIdx: number, sizeIdx: number, updates: Partial<SizeData>) {
    const v = variants[variantIdx]
    updateVariant(variantIdx, {
      sizes: v.sizes.map((s, i) => (i === sizeIdx ? { ...s, ...updates } : s)),
    })
  }

  return (
    <div className="space-y-3">
      {variants.map((variant, i) => {
        const isExpanded = expandedIdx === i
        const primaryImg = variant.images.find((img) => img.is_primary) ?? variant.images[0]
        const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

        return (
          <div
            key={i}
            className={cn(
              'border rounded-xl overflow-hidden transition-colors',
              variant.is_primary ? 'border-stone-900 bg-stone-50' : 'border-stone-200 bg-stone-50'
            )}
          >
            {/* Collapsed header */}
            <div
              className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-stone-100 transition-colors"
              onClick={() => setExpandedIdx(isExpanded ? null : i)}
            >
              {/* Color swatch */}
              <span
                className="h-6 w-6 rounded-full border border-stone-300 flex-shrink-0"
                style={{ backgroundColor: variant.hex_color || '#e7e5e4' }}
              />

              {/* Variant title */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-stone-700 truncate">
                    {variant.color_name_en || `Variant ${i + 1}`}
                  </span>
                  {variant.is_primary && (
                    <span className="text-[10px] bg-stone-900 text-white px-1.5 py-0.5 rounded">
                      Primary
                    </span>
                  )}
                  <span className="text-xs text-stone-400">
                    {variant.images.length} image{variant.images.length !== 1 ? 's' : ''}
                    {variant.sizes.length > 0 && ` · ${variant.sizes.length} size${variant.sizes.length !== 1 ? 's' : ''}`}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setPrimary(i)
                  }}
                  className={cn(
                    'h-7 w-7 rounded-full flex items-center justify-center transition-colors',
                    variant.is_primary
                      ? 'text-yellow-500'
                      : 'text-stone-300 hover:text-yellow-500'
                  )}
                  title="Set as primary variant"
                >
                  <Star className={cn('h-4 w-4', variant.is_primary && 'fill-yellow-400')} />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeVariant(i)
                  }}
                  className="h-7 w-7 rounded-full flex items-center justify-center text-stone-400 hover:text-red-500 transition-colors"
                  title="Remove variant"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-stone-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-stone-400" />
                )}
              </div>
            </div>

            {/* Expanded content */}
            {isExpanded && (
              <div className="px-4 pb-4 space-y-4 border-t border-stone-200">
                {/* Color names + SKU */}
                <div className="grid grid-cols-2 gap-3 pt-4">
                  <div>
                    <Label className="text-xs">Name (English)</Label>
                    <Input
                      placeholder="e.g. Red"
                      value={variant.color_name_en}
                      onChange={(e) => updateVariant(i, { color_name_en: e.target.value })}
                      className="mt-1 h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Name (Greek)</Label>
                    <Input
                      placeholder="π.χ. Κόκκινο"
                      value={variant.color_name_el}
                      onChange={(e) => updateVariant(i, { color_name_el: e.target.value })}
                      className="mt-1 h-8 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">SKU Suffix</Label>
                    <Input
                      placeholder="-RED"
                      value={variant.sku_suffix}
                      onChange={(e) => updateVariant(i, { sku_suffix: e.target.value })}
                      className="mt-1 h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Hex Color</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="color"
                        value={variant.hex_color}
                        onChange={(e) => updateVariant(i, { hex_color: e.target.value })}
                        className="h-8 w-10 rounded border border-stone-200 cursor-pointer"
                      />
                      <Input
                        placeholder="#000000"
                        value={variant.hex_color}
                        onChange={(e) => updateVariant(i, { hex_color: e.target.value })}
                        className="h-8 text-sm w-28 font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Images */}
                <div>
                  <Label className="text-xs mb-2 block">Images</Label>
                  {variant.id ? (
                    <ImageUploader
                      images={variant.images}
                      onChange={(imgs) => updateVariant(i, { images: imgs })}
                      productId={productId}
                      variantId={variant.id}
                    />
                  ) : (
                    <p className="text-xs text-stone-500 p-3 bg-stone-100 rounded-lg">
                      Save the product first to upload images for this variant.
                    </p>
                  )}
                </div>

                {/* Sizes (optional) */}
                <div>
                  <Separator className="my-2" />
                  <Label className="text-xs mb-2 block">Sizes (optional)</Label>
                  {variant.sizes.length > 0 && (
                    <div className="space-y-2 mb-2">
                      {variant.sizes.map((size, si) => (
                        <div key={si} className="flex items-center gap-2 bg-white border border-stone-200 rounded-lg p-2">
                          <Input
                            placeholder="EN label"
                            value={size.label_en}
                            onChange={(e) => updateSize(i, si, { label_en: e.target.value })}
                            className="h-7 text-xs flex-1"
                          />
                          <Input
                            placeholder="EL label"
                            value={size.label_el}
                            onChange={(e) => updateSize(i, si, { label_el: e.target.value })}
                            className="h-7 text-xs flex-1"
                          />
                          <Input
                            placeholder="SKU"
                            value={size.sku_suffix}
                            onChange={(e) => updateSize(i, si, { sku_suffix: e.target.value })}
                            className="h-7 text-xs w-20 font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => removeSize(i, si)}
                            className="text-stone-400 hover:text-red-500 transition-colors flex-shrink-0"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addSize(i)}
                    className="gap-1 h-7 text-xs"
                  >
                    <Plus className="h-3 w-3" />
                    Add Size
                  </Button>
                </div>
              </div>
            )}
          </div>
        )
      })}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addVariant}
        className="gap-2 w-full"
      >
        <Plus className="h-4 w-4" />
        Add Variant
      </Button>
    </div>
  )
}
