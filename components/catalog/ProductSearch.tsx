'use client'

import { useCallback } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useDebouncedCallback } from 'use-debounce'
import { Input } from '@/components/ui/input'

export function ProductSearch() {
  const t = useTranslations('catalog')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentQ = searchParams.get('q') ?? ''

  const updateSearch = useDebouncedCallback((value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value) {
      params.set('q', value)
    } else {
      params.delete('q')
    }
    // Reset to page 1 on new search
    params.delete('page')
    router.replace(`${pathname}?${params.toString()}`)
  }, 300)

  function clearSearch() {
    const params = new URLSearchParams(searchParams)
    params.delete('q')
    params.delete('page')
    router.replace(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
      <Input
        type="search"
        placeholder={t('search')}
        defaultValue={currentQ}
        onChange={(e) => updateSearch(e.target.value)}
        className="pl-9 pr-8 bg-stone-50 border-stone-200 focus-visible:ring-1 focus-visible:ring-stone-400"
      />
      {currentQ && (
        <button
          onClick={clearSearch}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
