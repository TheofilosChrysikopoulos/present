'use client'

import Image from 'next/image'
import { useState, useRef } from 'react'
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
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

function getImageUrl(path: string) {
  return `${SUPABASE_URL}/storage/v1/object/public/product-images/${path}`
}

/** Compute [topRow, bottomRow] thumbnail counts for the 2-row grid */
function getRowLayout(total: number): [number, number] {
  if (total <= 1) return [1, 0]
  if (total === 2) return [2, 0]
  if (total === 3) return [2, 1]
  if (total === 4) return [2, 2]
  if (total === 5) return [3, 2]
  if (total === 6) return [3, 3]
  if (total === 7) return [4, 3]
  if (total === 8) return [4, 4]
  return [0, 0]
}

export function CardImageGallery({ images, productName, locale }: CardImageGalleryProps) {
  // Sort: primary first, then by original order
  const sorted = [...images].sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1
    if (!a.is_primary && b.is_primary) return 1
    return 0
  })

  const [activeIndex, setActiveIndex] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const count = sorted.length

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

  // Single image — full display, no thumbnails
  if (count === 1) {
    const img = sorted[0]
    return (
      <div className="relative aspect-square bg-white overflow-hidden">
        <Image
          src={getImageUrl(img.storage_path)}
          alt={(locale === 'el' ? img.alt_el : img.alt_en) ?? productName}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
        />
      </div>
    )
  }

  const active = sorted[activeIndex]

  // 9+ images — main image + horizontal scrolling thumbnail strip
  if (count >= 9) {
    return (
      <div className="relative">
        {/* Main image */}
        <div className="relative aspect-square bg-white overflow-hidden">
          <Image
            src={getImageUrl(active.storage_path)}
            alt={(locale === 'el' ? active.alt_el : active.alt_en) ?? productName}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        {/* Scrollable thumbnail strip */}
        <div
          ref={scrollRef}
          className="flex gap-1 px-1.5 py-1 bg-slate-50/80 overflow-x-auto scrollbar-hide"
          onClick={(e) => { e.preventDefault(); e.stopPropagation() }}
        >
          {sorted.map((img, i) => (
            <button
              key={i}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setActiveIndex(i)
              }}
              className={cn(
                'relative flex-shrink-0 h-8 w-8 rounded overflow-hidden border transition-all',
                i === activeIndex
                  ? 'border-[#1e3a5f] ring-1 ring-[#1e3a5f]/30 opacity-100'
                  : 'border-transparent opacity-60 hover:opacity-100'
              )}
            >
              <Image
                src={getImageUrl(img.storage_path)}
                alt={`${productName} ${i + 1}`}
                fill
                sizes="32px"
                className="object-contain bg-white p-0.5"
              />
            </button>
          ))}
        </div>
        {/* Scroll indicator */}
        <div className="absolute bottom-0 right-1.5 h-6 w-6 flex items-center justify-center pointer-events-none">
          <span className="text-[9px] text-stone-400 bg-white/80 rounded px-1">{count}</span>
        </div>
      </div>
    )
  }

  // 2-8 images — main image + 2-row clickable thumbnail grid below
  const [topCount, bottomCount] = getRowLayout(count)
  const topRow = sorted.slice(0, topCount)
  const bottomRow = sorted.slice(topCount, topCount + bottomCount)

  return (
    <div className="relative bg-white overflow-hidden">
      {/* Main image */}
      <div className="relative aspect-square bg-white overflow-hidden">
        <Image
          src={getImageUrl(active.storage_path)}
          alt={(locale === 'el' ? active.alt_el : active.alt_en) ?? productName}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Thumbnail grid — 2 rows, as large as possible */}
      <div
        className="bg-slate-50/80"
        onClick={(e) => { e.preventDefault(); e.stopPropagation() }}
      >
        {/* Top row */}
        <div className="flex">
          {topRow.map((img, i) => (
            <button
              key={i}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setActiveIndex(i)
              }}
              className={cn(
                'relative flex-1 aspect-square overflow-hidden border-b border-slate-100 transition-all',
                i < topRow.length - 1 && 'border-r border-slate-100',
                i === activeIndex
                  ? 'ring-2 ring-inset ring-[#1e3a5f] opacity-100'
                  : 'opacity-60 hover:opacity-100'
              )}
            >
              <Image
                src={getImageUrl(img.storage_path)}
                alt={(locale === 'el' ? img.alt_el : img.alt_en) ?? `${productName} ${i + 1}`}
                fill
                sizes={`${Math.round(200 / topCount)}px`}
                className="object-contain bg-white p-0.5"
              />
            </button>
          ))}
        </div>
        {/* Bottom row */}
        {bottomCount > 0 && (
          <div className="flex">
            {bottomRow.map((img, i) => {
              const globalIdx = topCount + i
              return (
                <button
                  key={i}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setActiveIndex(globalIdx)
                  }}
                  className={cn(
                    'relative aspect-square overflow-hidden transition-all',
                    i < bottomRow.length - 1 && 'border-r border-slate-100',
                    globalIdx === activeIndex
                      ? 'ring-2 ring-inset ring-[#1e3a5f] opacity-100'
                      : 'opacity-60 hover:opacity-100'
                  )}
                  style={{ flex: `0 0 ${100 / topCount}%` }}
                >
                  <Image
                    src={getImageUrl(img.storage_path)}
                    alt={(locale === 'el' ? img.alt_el : img.alt_en) ?? `${productName} ${globalIdx + 1}`}
                    fill
                    sizes={`${Math.round(200 / topCount)}px`}
                    className="object-contain bg-white p-0.5"
                  />
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
