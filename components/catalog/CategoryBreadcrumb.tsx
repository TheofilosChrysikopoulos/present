import Link from 'next/link'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { getLocale, getTranslations } from 'next-intl/server'
import type { Category } from '@/lib/types'
import { getLocalizedField } from '@/lib/types'

interface CategoryBreadcrumbProps {
  current: Category
  ancestors: Category[]
}

export async function CategoryBreadcrumb({
  current,
  ancestors,
}: CategoryBreadcrumbProps) {
  const [locale, t] = await Promise.all([getLocale(), getTranslations('nav')])
  const base = locale === 'el' ? '/el' : ''

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href={`${base}/`}>{t('home')}</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href={`${base}/catalog`}>{t('catalog')}</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {ancestors.map((ancestor) => (
          <>
            <BreadcrumbSeparator key={`sep-${ancestor.id}`} />
            <BreadcrumbItem key={ancestor.id}>
              <BreadcrumbLink asChild>
                <Link href={`${base}/catalog/${ancestor.slug}`}>
                  {getLocalizedField(ancestor, locale)}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
          </>
        ))}

        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{getLocalizedField(current, locale)}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}
