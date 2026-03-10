'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'

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
  activeIndex: number
  onChangeIndex: (index: number) => void
}

export function ProductImageGallery({
  images,
  productName,
  locale,
  activeIndex,
  onChangeIndex,
}: ProductImageGalleryProps) {
  const safeIndex = Math.min(activeIndex, Math.max(0, images.length - 1))
  const active = images[safeIndex]

  if (!images.length) {
    return (
      <div className="aspect-square bg-slate-100 rounded-xl flex items-center justify-center text-slate-300">
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
    <div className="space-y-3">
      {/* Main image */}
      <div className="relative aspect-square rounded-xl overflow-hidden bg-white">
        <Image
          src={imgUrl(active.storage_path)}
          alt={
            (locale === 'el' ? active.alt_el : active.alt_en) ?? productName
          }
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-contain p-3"
          priority
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => onChangeIndex(i)}
              className={cn(
                'relative h-16 w-16 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all',
                i === safeIndex
                  ? 'border-[#1e3a5f] opacity-100'
                  : 'border-slate-200 opacity-70 hover:opacity-100'
              )}
            >
              <Image
                src={imgUrl(img.storage_path)}
                alt={
                  (locale === 'el' ? img.alt_el : img.alt_en) ?? `Image ${i + 1}`
                }
                fill
                sizes="64px"
                className="object-contain bg-white p-0.5"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
