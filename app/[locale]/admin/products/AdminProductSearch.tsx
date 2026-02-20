'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useDebouncedCallback } from 'use-debounce'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

export function AdminProductSearch() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const updateSearch = useDebouncedCallback((value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value) {
      params.set('q', value)
    } else {
      params.delete('q')
    }
    params.delete('page')
    router.replace(`${pathname}?${params.toString()}`)
  }, 300)

  return (
    <div className="relative max-w-sm">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
      <Input
        type="search"
        placeholder="Search products by name or SKU..."
        defaultValue={searchParams.get('q') ?? ''}
        onChange={(e) => updateSearch(e.target.value)}
        className="pl-9"
      />
    </div>
  )
}
