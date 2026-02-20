'use client'

import Image from 'next/image'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { ProductImage, VariantImage } from '@/lib/types'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

function imgUrl(path: string) {
  return `${SUPABASE_URL}/storage/v1/object/public/product-images/${path}`
}

interface GalleryImage {
  id: string
  storage_path: string
  alt_en: string | null
  alt_el: string | null
  is_primary: boolean
  sort_order: number
}

interface ProductImageGalleryProps {
  images: GalleryImage[]
  productName: string
  locale: string
}

export function ProductImageGallery({
  images,
  productName,
  locale,
}: ProductImageGalleryProps) {
  const sorted = [...images].sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1
    if (!a.is_primary && b.is_primary) return 1
    return a.sort_order - b.sort_order
  })

  const [activeIndex, setActiveIndex] = useState(0)
  const active = sorted[activeIndex]

  if (!images.length) {
    return (
      <div className="aspect-square bg-secondary rounded-2xl flex items-center justify-center text-muted-foreground/30">
        <svg
          className="h-24 w-24"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Main image */}
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-secondary">
        <Image
          src={imgUrl(active.storage_path)}
          alt={
            (locale === 'el' ? active.alt_el : active.alt_en) ?? productName
          }
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
          priority
        />
      </div>

      {/* Thumbnails */}
      {sorted.length > 1 && (
        <div className="flex gap-3 flex-wrap">
          {sorted.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setActiveIndex(i)}
              className={cn(
                'relative h-20 w-20 rounded-xl overflow-hidden flex-shrink-0 transition-all duration-200',
                i === activeIndex
                  ? 'ring-2 ring-foreground ring-offset-2'
                  : 'opacity-60 hover:opacity-100'
              )}
            >
              <Image
                src={imgUrl(img.storage_path)}
                alt={
                  (locale === 'el' ? img.alt_el : img.alt_en) ?? `Image ${i + 1}`
                }
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
