'use client'

import { useRef, useCallback } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CardImageGalleryProps {
  images: Array<{
    storage_path: string
    alt_en: string | null
    alt_el: string | null
    is_primary: boolean
  }>
  productName: string
  locale: string
  activeIndex: number
  onChangeIndex: (index: number) => void
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SWIPE_THRESHOLD = 30

function getImageUrl(path: string) {
  return `${SUPABASE_URL}/storage/v1/object/public/product-images/${path}`
}

export function CardImageGallery({
  images,
  productName,
  locale,
  activeIndex,
  onChangeIndex,
}: CardImageGalleryProps) {
  const count = images.length
  const touchStartX = useRef(0)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }, [])

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const dx = e.changedTouches[0].clientX - touchStartX.current
      if (Math.abs(dx) < SWIPE_THRESHOLD) return
      if (dx < 0) {
        // swipe left → next
        onChangeIndex(activeIndex >= count - 1 ? 0 : activeIndex + 1)
      } else {
        // swipe right → prev
        onChangeIndex(activeIndex <= 0 ? count - 1 : activeIndex - 1)
      }
    },
    [activeIndex, count, onChangeIndex]
  )

  if (count === 0) {
    return (
      <div className="relative aspect-square bg-white overflow-hidden flex items-center justify-center text-stone-300">
        <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    )
  }

  const safeIndex = Math.min(activeIndex, count - 1)
  const img = images[safeIndex]

  // Buttons: hidden by default, visible on hover for pointer devices; always visible on touch devices
  const btnClass =
    'absolute top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-white/80 shadow-sm flex items-center justify-center text-slate-600 transition-opacity [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/gallery:opacity-100 hover:bg-white'

  return (
    <div
      className="relative aspect-square bg-white overflow-hidden group/gallery touch-pan-y"
      onTouchStart={count > 1 ? handleTouchStart : undefined}
      onTouchEnd={count > 1 ? handleTouchEnd : undefined}
    >
      <Image
        src={getImageUrl(img.storage_path)}
        alt={(locale === 'el' ? img.alt_el : img.alt_en) ?? productName}
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
      />

      {/* Navigation arrows */}
      {count > 1 && (
        <>
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onChangeIndex(safeIndex <= 0 ? count - 1 : safeIndex - 1)
            }}
            className={cn(btnClass, 'left-1')}
            aria-label="Previous image"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onChangeIndex(safeIndex >= count - 1 ? 0 : safeIndex + 1)
            }}
            className={cn(btnClass, 'right-1')}
            aria-label="Next image"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {count > 1 && count <= 6 && (
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1">
          {images.map((_, i) => (
            <span
              key={i}
              className={cn(
                'h-1.5 w-1.5 rounded-full transition-all',
                i === safeIndex ? 'bg-[#1e3a5f]' : 'bg-slate-300'
              )}
            />
          ))}
        </div>
      )}

      {/* Count badge for many images */}
      {count > 6 && (
        <div className="absolute bottom-1.5 right-1.5">
          <span className="text-[9px] text-slate-500 bg-white/80 rounded px-1.5 py-0.5">
            {safeIndex + 1}/{count}
          </span>
        </div>
      )}
    </div>
  )
}
