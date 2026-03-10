import Link from 'next/link'
import Image from 'next/image'
import { getLocale } from 'next-intl/server'
import { Plus, Pencil, ImageIcon } from 'lucide-react'
import { getProducts } from '@/lib/queries/products'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AdminProductSearch } from './AdminProductSearch'
import { AdminDeleteProduct } from './AdminDeleteProduct'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
function imgUrl(path: string) {
  return `${SUPABASE_URL}/storage/v1/object/public/product-images/${path}`
}

interface AdminProductsPageProps {
  searchParams: Promise<{ q?: string; page?: string }>
}

export default async function AdminProductsPage({
  searchParams,
}: AdminProductsPageProps) {
  const sp = await searchParams
  const locale = await getLocale()
  const base = `/${locale}`

  const { products, total, page, totalPages } = await getProducts({
    search: sp.q,
    page: sp.page ? Number(sp.page) : 1,
    limit: 30,
    adminView: true,
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Products</h1>
          <p className="text-sm text-stone-500 mt-0.5">{total} total products</p>
        </div>
        <Button asChild>
          <Link href={`${base}/admin/products/new`} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Product
          </Link>
        </Button>
      </div>

      <div className="mb-4">
        <AdminProductSearch />
      </div>

      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-100 bg-stone-50">
              <th className="text-left px-4 py-3 font-medium text-stone-500 text-xs uppercase tracking-wide">
                Product
              </th>
              <th className="text-left px-4 py-3 font-medium text-stone-500 text-xs uppercase tracking-wide hidden md:table-cell">
                SKU
              </th>
              <th className="text-left px-4 py-3 font-medium text-stone-500 text-xs uppercase tracking-wide hidden lg:table-cell">
                Category
              </th>
              <th className="text-right px-4 py-3 font-medium text-stone-500 text-xs uppercase tracking-wide">
                Price
              </th>
              <th className="text-center px-4 py-3 font-medium text-stone-500 text-xs uppercase tracking-wide hidden md:table-cell">
                Status
              </th>
              <th className="text-right px-4 py-3 font-medium text-stone-500 text-xs uppercase tracking-wide">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {products.map((product) => {
              // Resolve primary image from primary variant's images, falling back to first variant then product_images
              const pv = (product as any).product_variants as any[] | undefined
              const primaryVariant = pv?.find((v: any) => v.is_primary) ?? pv?.[0]
              const variantImgs = primaryVariant?.variant_images as any[] | undefined
              const primaryImg = variantImgs?.find((img: any) => img.is_primary)
                ?? variantImgs?.[0]
                ?? (product as any).product_images?.find((img: any) => img.is_primary)
                ?? (product as any).product_images?.[0]
              return (
              <tr key={product.id} className="hover:bg-stone-50 cursor-pointer">
                <td className="px-4 py-3">
                  <Link href={`${base}/admin/products/${product.id}`} className="flex items-center gap-3">
                    {primaryImg ? (
                      <div className="h-10 w-10 rounded-md overflow-hidden border border-stone-100 bg-white flex-shrink-0 relative">
                        <Image
                          src={imgUrl(primaryImg.storage_path)}
                          alt={product.name_en}
                          fill
                          sizes="40px"
                          className="object-contain p-0.5"
                        />
                      </div>
                    ) : (
                      <div className="h-10 w-10 rounded-md border border-stone-100 bg-stone-50 flex items-center justify-center flex-shrink-0">
                        <ImageIcon className="h-4 w-4 text-stone-300" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-stone-900">{product.name_en}</p>
                      <p className="text-xs text-stone-400 md:hidden font-mono">
                        {product.sku}
                      </p>
                    </div>
                  </Link>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <Link href={`${base}/admin/products/${product.id}`} className="block text-stone-500 font-mono text-xs">
                    {product.sku}
                  </Link>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <Link href={`${base}/admin/products/${product.id}`} className="block text-stone-500">
                    {(product as any).categories?.name_en ?? '—'}
                  </Link>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`${base}/admin/products/${product.id}`} className="block font-medium">
                    {(product as any).discount_price != null ? (
                      <>
                        <span className="line-through text-stone-400 text-xs mr-1">€{product.price.toFixed(2)}</span>
                        <span className="text-red-600">€{Number((product as any).discount_price).toFixed(2)}</span>
                      </>
                    ) : (
                      <>€{product.price.toFixed(2)}</>
                    )}
                  </Link>
                </td>
                <td className="px-4 py-3 text-center hidden md:table-cell">
                  <Link href={`${base}/admin/products/${product.id}`} className="flex items-center justify-center gap-1">
                    {product.is_active ? (
                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        Draft
                      </Badge>
                    )}
                    {product.is_featured && (
                      <Badge className="text-xs bg-stone-900">Featured</Badge>
                    )}
                    {product.is_new_arrival && (
                      <Badge variant="outline" className="text-xs">New</Badge>
                    )}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Button asChild variant="ghost" size="sm" className="h-7 px-2">
                      <Link href={`${base}/admin/products/${product.id}`}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                    <AdminDeleteProduct productId={product.id} productName={product.name_en} />
                  </div>
                </td>
              </tr>
              )
            })}
          </tbody>
        </table>

        {products.length === 0 && (
          <div className="py-12 text-center text-stone-500 text-sm">
            No products found
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {page > 1 && (
            <Button asChild variant="outline" size="sm">
              <Link href={`${base}/admin/products?page=${page - 1}${sp.q ? `&q=${sp.q}` : ''}`}>
                Previous
              </Link>
            </Button>
          )}
          <span className="text-sm text-stone-500">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Button asChild variant="outline" size="sm">
              <Link href={`${base}/admin/products?page=${page + 1}${sp.q ? `&q=${sp.q}` : ''}`}>
                Next
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
