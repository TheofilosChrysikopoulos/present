'use client'

import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export interface SizeData {
  id?: string
  label_en: string
  label_el: string
  sku_suffix: string
  sort_order: number
}

interface SizeEditorProps {
  sizes: SizeData[]
  onChange: (sizes: SizeData[]) => void
}

const emptySize = (): SizeData => ({
  label_en: '',
  label_el: '',
  sku_suffix: '',
  sort_order: 0,
})

export function SizeEditor({ sizes, onChange }: SizeEditorProps) {
  function addSize() {
    onChange([...sizes, { ...emptySize(), sort_order: sizes.length }])
  }

  function removeSize(index: number) {
    onChange(sizes.filter((_, i) => i !== index))
  }

  function updateSize(index: number, updates: Partial<SizeData>) {
    onChange(sizes.map((s, i) => (i === index ? { ...s, ...updates } : s)))
  }

  return (
    <div className="space-y-4">
      {sizes.map((size, i) => (
        <div
          key={i}
          className="border border-stone-200 rounded-xl p-4 space-y-4 bg-stone-50"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-stone-700">
              Size {i + 1}
            </h4>
            <button
              type="button"
              onClick={() => removeSize(i)}
              className="text-stone-400 hover:text-red-500 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          {/* Size labels */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Size Label (English)</Label>
              <Input
                placeholder="e.g. Large"
                value={size.label_en}
                onChange={(e) => updateSize(i, { label_en: e.target.value })}
                className="mt-1 h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Size Label (Greek)</Label>
              <Input
                placeholder="π.χ. Μεγάλο"
                value={size.label_el}
                onChange={(e) => updateSize(i, { label_el: e.target.value })}
                className="mt-1 h-8 text-sm"
              />
            </div>
          </div>

          {/* SKU suffix */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">SKU Suffix</Label>
              <Input
                placeholder="-LG"
                value={size.sku_suffix}
                onChange={(e) => updateSize(i, { sku_suffix: e.target.value })}
                className="mt-1 h-8 text-sm"
              />
            </div>
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addSize}
        className="gap-2 w-full"
      >
        <Plus className="h-4 w-4" />
        Add Size Variant
      </Button>
    </div>
  )
}
