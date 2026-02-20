import Link from 'next/link'
import { getLocale } from 'next-intl/server'
import { Plus, Pencil } from 'lucide-react'
import { getProducts } from '@/lib/queries/products'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AdminProductSearch } from './AdminProductSearch'
import { AdminDeleteProduct } from './AdminDeleteProduct'

interface AdminProductsPageProps {
  searchParams: Promise<{ q?: string; page?: string }>
}

export default async function AdminProductsPage({
  searchParams,
}: AdminProductsPageProps) {
  const sp = await searchParams
  const locale = await getLocale()
  const base = locale === 'el' ? '/el' : ''

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
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-stone-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-stone-900">{product.name_en}</p>
                  <p className="text-xs text-stone-400 md:hidden font-mono">
                    {product.sku}
                  </p>
                </td>
                <td className="px-4 py-3 text-stone-500 font-mono text-xs hidden md:table-cell">
                  {product.sku}
                </td>
                <td className="px-4 py-3 text-stone-500 hidden lg:table-cell">
                  {(product as any).categories?.name_en ?? '—'}
                </td>
                <td className="px-4 py-3 text-right font-medium">
                  €{product.price.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-center hidden md:table-cell">
                  <div className="flex items-center justify-center gap-1">
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
                  </div>
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
            ))}
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
