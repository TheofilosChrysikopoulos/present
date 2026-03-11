'use client'

import { useState, useCallback, useRef } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp, Star, GripVertical, Upload, X } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { uploadVariantImage } from '@/lib/storage/uploadImage'
import { cn } from '@/lib/utils'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
function imgUrl(path: string) {
  return `${SUPABASE_URL}/storage/v1/object/public/product-images/${path}`
}

export type UploadedImage = {
  id?: string
  storage_path: string
  alt_en?: string
  alt_el?: string
  sort_order: number
  is_primary: boolean
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
})

/* ── Drag source identifier ─────────────────── */
type DragPayload = { fromVariant: number; imgIdx: number }

export function VariantEditor({
  variants,
  onChange,
  productId,
}: VariantEditorProps) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(
    variants.length > 0 ? 0 : null
  )
  const dragRef = useRef<DragPayload | null>(null)
  const [dropTarget, setDropTarget] = useState<number | 'new' | null>(null)

  /* ── Variant CRUD ─────────────────── */

  function addVariant(initialImages?: UploadedImage[]) {
    const isFirst = variants.length === 0
    const newVariant: VariantData = {
      ...emptyVariant(),
      sort_order: variants.length,
      is_primary: isFirst,
      images: initialImages ?? [],
    }
    onChange([...variants, newVariant])
    setExpandedIdx(variants.length)
  }

  function removeVariant(index: number) {
    const removed = variants[index]
    const updated = variants.filter((_, i) => i !== index)
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
    onChange(variants.map((v, i) => ({ ...v, is_primary: i === index })))
  }

  /* ── Image primary / remove ─────── */

  function setImagePrimary(variantIdx: number, imgIdx: number) {
    const v = variants[variantIdx]
    updateVariant(variantIdx, {
      images: v.images.map((img, j) => ({ ...img, is_primary: j === imgIdx })),
    })
  }

  function removeImage(variantIdx: number, imgIdx: number) {
    const v = variants[variantIdx]
    const updated = v.images.filter((_, j) => j !== imgIdx)
    if (v.images[imgIdx].is_primary && updated.length > 0) {
      updated[0] = { ...updated[0], is_primary: true }
    }
    updateVariant(variantIdx, { images: updated })
  }

  /* ── Cross-variant drag & drop ──── */

  function handleDragStart(variantIdx: number, imgIdx: number, e: React.DragEvent) {
    dragRef.current = { fromVariant: variantIdx, imgIdx }
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', '') // required for Firefox
  }

  function handleDropOnVariant(toVariantIdx: number, e: React.DragEvent) {
    e.preventDefault()
    setDropTarget(null)
    const payload = dragRef.current
    if (!payload) return
    const { fromVariant, imgIdx } = payload
    dragRef.current = null
    if (fromVariant === toVariantIdx) return

    const copy = variants.map((v) => ({ ...v, images: [...v.images] }))
    const [movedImg] = copy[fromVariant].images.splice(imgIdx, 1)
    // If removed image was primary in source, promote next
    if (movedImg.is_primary && copy[fromVariant].images.length > 0) {
      copy[fromVariant].images[0] = { ...copy[fromVariant].images[0], is_primary: true }
    }
    // Add to target; if target was empty, make it primary
    const isPrimaryInTarget = copy[toVariantIdx].images.length === 0
    copy[toVariantIdx].images.push({
      ...movedImg,
      is_primary: isPrimaryInTarget,
      sort_order: copy[toVariantIdx].images.length,
    })
    onChange(copy)
  }

  function handleDropOnNewVariant(e: React.DragEvent) {
    e.preventDefault()
    setDropTarget(null)
    const payload = dragRef.current
    if (!payload) return
    const { fromVariant, imgIdx } = payload
    dragRef.current = null

    const copy = variants.map((v) => ({ ...v, images: [...v.images] }))
    const [movedImg] = copy[fromVariant].images.splice(imgIdx, 1)
    if (movedImg.is_primary && copy[fromVariant].images.length > 0) {
      copy[fromVariant].images[0] = { ...copy[fromVariant].images[0], is_primary: true }
    }

    const isFirst = copy.length === 0
    const newVariant: VariantData = {
      ...emptyVariant(),
      sort_order: copy.length,
      is_primary: isFirst,
      images: [{ ...movedImg, is_primary: true, sort_order: 0 }],
    }
    onChange([...copy, newVariant])
    setExpandedIdx(copy.length)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  /* ── Render ────────────────────── */

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Variants</Label>

      {variants.map((variant, i) => (
        <VariantCard
          key={i}
          variant={variant}
          index={i}
          isExpanded={expandedIdx === i}
          isDropTarget={dropTarget === i}
          productId={productId}
          onToggle={() => setExpandedIdx(expandedIdx === i ? null : i)}
          onUpdate={(u) => updateVariant(i, u)}
          onRemove={() => removeVariant(i)}
          onSetPrimary={() => setPrimary(i)}
          onSetImagePrimary={(imgIdx) => setImagePrimary(i, imgIdx)}
          onRemoveImage={(imgIdx) => removeImage(i, imgIdx)}
          onDragStart={(imgIdx, e) => handleDragStart(i, imgIdx, e)}
          onDrop={(e) => handleDropOnVariant(i, e)}
          onDragOver={handleDragOver}
          onDragEnter={() => setDropTarget(i)}
          onDragLeave={() => setDropTarget((cur) => (cur === i ? null : cur))}
        />
      ))}

      {/* Drop zone for creating a new variant */}
      <div
        onDrop={handleDropOnNewVariant}
        onDragOver={handleDragOver}
        onDragEnter={() => setDropTarget('new')}
        onDragLeave={() => setDropTarget((cur) => (cur === 'new' ? null : cur))}
        className={cn(
          'border-2 border-dashed rounded-xl p-4 text-center transition-colors',
          dropTarget === 'new'
            ? 'border-stone-500 bg-stone-100'
            : 'border-stone-200'
        )}
      >
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => addVariant()}
          className="gap-2 w-full"
        >
          <Plus className="h-4 w-4" />
          Add Variant
        </Button>
        {dropTarget === 'new' && (
          <p className="text-xs text-stone-500 mt-1">Drop image here to create a new variant</p>
        )}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────
   Variant Card (extracted for clarity)
   ───────────────────────────────────────────────────── */

interface VariantCardProps {
  variant: VariantData
  index: number
  isExpanded: boolean
  isDropTarget: boolean
  productId: string
  onToggle: () => void
  onUpdate: (u: Partial<VariantData>) => void
  onRemove: () => void
  onSetPrimary: () => void
  onSetImagePrimary: (imgIdx: number) => void
  onRemoveImage: (imgIdx: number) => void
  onDragStart: (imgIdx: number, e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent) => void
  onDragEnter: () => void
  onDragLeave: () => void
}

function VariantCard({
  variant,
  index: i,
  isExpanded,
  isDropTarget,
  productId,
  onToggle,
  onUpdate,
  onRemove,
  onSetPrimary,
  onSetImagePrimary,
  onRemoveImage,
  onDragStart,
  onDrop,
  onDragOver,
  onDragEnter,
  onDragLeave,
}: VariantCardProps) {
  const [uploading, setUploading] = useState(false)

  const onFileDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!variant.id) return
      setUploading(true)
      try {
        const newImgs: UploadedImage[] = []
        for (const file of acceptedFiles) {
          const result = await uploadVariantImage(file, variant.id)
          newImgs.push({
            storage_path: result.path,
            sort_order: variant.images.length + newImgs.length,
            is_primary: variant.images.length === 0 && newImgs.length === 0,
          })
        }
        onUpdate({ images: [...variant.images, ...newImgs] })
      } catch {
        // silently fail — could add toast here
      } finally {
        setUploading(false)
      }
    },
    [variant.id, variant.images, onUpdate]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onFileDrop,
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [] },
    maxSize: 5 * 1024 * 1024,
    multiple: true,
    noClick: false,
    noDrag: false,
  })

  return (
    <div
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      className={cn(
        'border rounded-xl overflow-hidden transition-colors',
        variant.is_primary ? 'border-stone-900 bg-stone-50' : 'border-stone-200 bg-stone-50',
        isDropTarget && 'ring-2 ring-stone-400 ring-offset-1'
      )}
    >
      {/* Collapsed header */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-stone-100 transition-colors"
        onClick={onToggle}
      >
        <span
          className="h-6 w-6 rounded-full border border-stone-300 flex-shrink-0"
          style={{ backgroundColor: variant.hex_color || '#e7e5e4' }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-stone-700 truncate">
              {variant.color_name_en || `Variant ${i + 1}`}
            </span>
            {variant.is_primary && (
              <span className="text-[10px] bg-stone-900 text-white px-1.5 py-0.5 rounded">Primary</span>
            )}
            <span className="text-xs text-stone-400">
              {variant.images.length} img{variant.images.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onSetPrimary() }}
            className={cn('h-7 w-7 rounded-full flex items-center justify-center transition-colors', variant.is_primary ? 'text-yellow-500' : 'text-stone-300 hover:text-yellow-500')}
            title="Set as primary variant"
          >
            <Star className={cn('h-4 w-4', variant.is_primary && 'fill-yellow-400')} />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onRemove() }}
            className="h-7 w-7 rounded-full flex items-center justify-center text-stone-400 hover:text-red-500 transition-colors"
            title="Remove variant"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          {isExpanded ? <ChevronUp className="h-4 w-4 text-stone-400" /> : <ChevronDown className="h-4 w-4 text-stone-400" />}
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-stone-200">
          {/* Names + SKU + Color */}
          <div className="grid grid-cols-2 gap-3 pt-4">
            <div>
              <Label className="text-xs">Name (English)</Label>
              <Input placeholder="e.g. Red" value={variant.color_name_en} onChange={(e) => onUpdate({ color_name_en: e.target.value })} className="mt-1 h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Name (Greek)</Label>
              <Input placeholder="π.χ. Κόκκινο" value={variant.color_name_el} onChange={(e) => onUpdate({ color_name_el: e.target.value })} className="mt-1 h-8 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">SKU Suffix</Label>
              <Input placeholder="-RED" value={variant.sku_suffix} onChange={(e) => onUpdate({ sku_suffix: e.target.value })} className="mt-1 h-8 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Hex Color</Label>
              <div className="flex items-center gap-2 mt-1">
                <input type="color" value={variant.hex_color} onChange={(e) => onUpdate({ hex_color: e.target.value })} className="h-8 w-10 rounded border border-stone-200 cursor-pointer" />
                <Input placeholder="#000000" value={variant.hex_color} onChange={(e) => onUpdate({ hex_color: e.target.value })} className="h-8 text-sm w-28 font-mono" />
              </div>
            </div>
          </div>

          {/* ── Images (with file drop zone + draggable thumbnails) ── */}
          <div>
            <Label className="text-xs mb-2 block">Images</Label>

            {/* Thumbnails – draggable between variants */}
            {variant.images.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 mb-3">
                {variant.images.map((img, j) => (
                  <div
                    key={img.storage_path}
                    draggable
                    onDragStart={(e) => {
                      e.stopPropagation()
                      onDragStart(j, e)
                    }}
                    className={cn(
                      'relative group rounded-lg overflow-hidden border-2 cursor-grab active:cursor-grabbing',
                      img.is_primary ? 'border-stone-900' : 'border-stone-200'
                    )}
                  >
                    <div className="aspect-square relative bg-white">
                      <Image
                        src={imgUrl(img.storage_path)}
                        alt={img.alt_en ?? 'Variant image'}
                        fill
                        sizes="100px"
                        className="object-contain p-1 pointer-events-none"
                      />
                    </div>
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 pointer-events-none">
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onSetImagePrimary(j) }}
                        className="h-7 w-7 rounded-full bg-white/90 flex items-center justify-center pointer-events-auto cursor-pointer"
                        title="Set as primary"
                      >
                        <Star className={cn('h-3.5 w-3.5', img.is_primary ? 'fill-yellow-400 text-yellow-400' : 'text-stone-600')} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemoveImage(j) }}
                        className="h-7 w-7 rounded-full bg-white/90 flex items-center justify-center pointer-events-auto cursor-pointer"
                        title="Remove image"
                      >
                        <X className="h-3.5 w-3.5 text-red-600" />
                      </button>
                    </div>
                    {img.is_primary && (
                      <div className="absolute top-1 left-1 bg-stone-900 text-white text-[9px] px-1 rounded">Primary</div>
                    )}
                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-80 transition-opacity">
                      <GripVertical className="h-3.5 w-3.5 text-white drop-shadow" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Upload drop zone */}
            {variant.id ? (
              <div
                {...getRootProps()}
                className={cn(
                  'border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors',
                  isDragActive ? 'border-stone-500 bg-stone-100' : 'border-stone-200 hover:border-stone-400'
                )}
              >
                <input {...getInputProps()} />
                <Upload className="h-6 w-6 text-stone-300 mx-auto mb-1" />
                <p className="text-xs text-stone-500">
                  {uploading ? 'Uploading...' : 'Drop images or click to upload'}
                </p>
              </div>
            ) : (
              <p className="text-xs text-stone-500 p-3 bg-stone-100 rounded-lg">
                Save the product first to upload images for this variant.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
