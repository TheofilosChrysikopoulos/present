'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { ImageUploader, type UploadedImage } from './ImageUploader'
import { cn } from '@/lib/utils'

export interface VariantData {
  id?: string
  sku_suffix: string
  color_name_en: string
  color_name_el: string
  hex_color: string
  variant_type: 'swatch' | 'image'
  sort_order: number
  images: UploadedImage[]
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
  variant_type: 'swatch',
  sort_order: 0,
  images: [],
})

export function VariantEditor({
  variants,
  onChange,
  productId,
}: VariantEditorProps) {
  function addVariant() {
    onChange([...variants, { ...emptyVariant(), sort_order: variants.length }])
  }

  function removeVariant(index: number) {
    onChange(variants.filter((_, i) => i !== index))
  }

  function updateVariant(index: number, updates: Partial<VariantData>) {
    onChange(variants.map((v, i) => (i === index ? { ...v, ...updates } : v)))
  }

  return (
    <div className="space-y-4">
      {variants.map((variant, i) => (
        <div
          key={i}
          className="border border-stone-200 rounded-xl p-4 space-y-4 bg-stone-50"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-stone-700">
              Variant {i + 1}
            </h4>
            <button
              type="button"
              onClick={() => removeVariant(i)}
              className="text-stone-400 hover:text-red-500 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          {/* Type selector */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Variant Type</Label>
              <Select
                value={variant.variant_type}
                onValueChange={(v) =>
                  updateVariant(i, { variant_type: v as 'swatch' | 'image' })
                }
              >
                <SelectTrigger className="mt-1 h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="swatch">Color Swatch</SelectItem>
                  <SelectItem value="image">With Image</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">SKU Suffix</Label>
              <Input
                placeholder="-RED"
                value={variant.sku_suffix}
                onChange={(e) => updateVariant(i, { sku_suffix: e.target.value })}
                className="mt-1 h-8 text-sm"
              />
            </div>
          </div>

          {/* Color names */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Color Name (English)</Label>
              <Input
                placeholder="e.g. Red"
                value={variant.color_name_en}
                onChange={(e) => updateVariant(i, { color_name_en: e.target.value })}
                className="mt-1 h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Color Name (Greek)</Label>
              <Input
                placeholder="π.χ. Κόκκινο"
                value={variant.color_name_el}
                onChange={(e) => updateVariant(i, { color_name_el: e.target.value })}
                className="mt-1 h-8 text-sm"
              />
            </div>
          </div>

          {/* Hex color */}
          <div className="flex items-center gap-3">
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

          {/* Images for image-type variants */}
          {variant.variant_type === 'image' && (
            <div>
              <Label className="text-xs mb-2 block">Variant Images</Label>
              {variant.id ? (
                <ImageUploader
                  images={variant.images}
                  onChange={(imgs) => updateVariant(i, { images: imgs })}
                  productId={productId}
                  variantId={variant.id}
                />
              ) : (
                <p className="text-xs text-stone-500">
                  Save the product first to upload variant images.
                </p>
              )}
            </div>
          )}
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addVariant}
        className="gap-2 w-full"
      >
        <Plus className="h-4 w-4" />
        Add Color Variant
      </Button>
    </div>
  )
}
