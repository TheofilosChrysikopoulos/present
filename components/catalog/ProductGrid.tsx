import { ProductCard } from './ProductCard'
import { Skeleton } from '@/components/ui/skeleton'

interface ProductGridProps {
  products: Parameters<typeof ProductCard>[0]['product'][]
  className?: string
}

export function ProductGrid({ products, className }: ProductGridProps) {
  return (
    <div
      className={
        className ??
        'grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8'
      }
    >
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}

export function ProductGridSkeleton({ count = 16 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-border overflow-hidden bg-white"
        >
          <Skeleton className="aspect-[4/5] w-full" />
          <div className="p-5 space-y-3">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-5 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}
