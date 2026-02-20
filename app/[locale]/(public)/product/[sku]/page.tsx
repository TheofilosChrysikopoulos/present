import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getProductBySku } from '@/lib/queries/products'
import { getLocalizedField, getLocalizedDescription } from '@/lib/types'
import { ProductDetail } from '@/components/product/ProductDetail'

// Dynamic rendering — thousands of products makes static generation impractical
export const dynamic = 'force-dynamic'

interface ProductPageProps {
  params: Promise<{ locale: string; sku: string }>
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { sku, locale } = await params
  const product = await getProductBySku(sku)
  if (!product) return {}
  return {
    title: getLocalizedField(product, locale),
    description:
      getLocalizedDescription(product, locale)?.slice(0, 160) ??
      `${product.sku} — wholesale price €${product.price}`,
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { sku } = await params
  const product = await getProductBySku(sku)
  if (!product) notFound()

  return <ProductDetail product={product} />
}
