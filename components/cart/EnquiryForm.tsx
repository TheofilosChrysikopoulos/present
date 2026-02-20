'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useCart } from '@/hooks/useCart'
import type { EnquiryCartItem } from '@/lib/types'

const enquirySchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email required'),
  company: z.string().optional(),
  phone: z.string().optional(),
  message: z.string().optional(),
})

type EnquiryFormValues = z.infer<typeof enquirySchema>

export function EnquiryForm() {
  const t = useTranslations('enquiry')
  const { items, clearCart } = useCart()
  const [submitted, setSubmitted] = useState(false)

  const form = useForm<EnquiryFormValues>({
    resolver: zodResolver(enquirySchema),
    defaultValues: {
      name: '',
      email: '',
      company: '',
      phone: '',
      message: '',
    },
  })

  async function onSubmit(values: EnquiryFormValues) {
    const cartSnapshot: EnquiryCartItem[] = items.map((item) => ({
      product_id: item.productId,
      sku: item.sku,
      name_en: item.nameEn,
      name_el: item.nameEl,
      qty: item.qty,
      price: item.price,
      variant_id: item.variant?.id,
      variant_color_en: item.variant?.colorNameEn,
      variant_color_el: item.variant?.colorNameEl,
    }))

    try {
      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, cart_snapshot: cartSnapshot }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Request failed')
      }

      setSubmitted(true)
      toast.success(t('success'))
      // Don't auto-clear cart — let user decide
    } catch (err) {
      toast.error(t('error'))
    }
  }

  if (submitted) {
    return (
      <div className="py-4 text-center">
        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
          <Send className="h-5 w-5 text-green-600" />
        </div>
        <p className="text-sm text-stone-700 font-medium">{t('success')}</p>
        <button
          onClick={() => setSubmitted(false)}
          className="mt-3 text-xs text-stone-400 hover:text-stone-600 underline"
        >
          Send another enquiry
        </button>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <h2 className="font-semibold text-stone-900 mb-1">{t('title')}</h2>
        <p className="text-xs text-stone-500 mb-3">{t('subtitle')}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">{t('name')} *</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t('namePlaceholder')}
                    className="h-8 text-sm"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">{t('email')} *</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder={t('emailPlaceholder')}
                    className="h-8 text-sm"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="company"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">{t('company')}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t('companyPlaceholder')}
                    className="h-8 text-sm"
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">{t('phone')}</FormLabel>
                <FormControl>
                  <Input
                    type="tel"
                    placeholder={t('phonePlaceholder')}
                    className="h-8 text-sm"
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">{t('message')}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t('messagePlaceholder')}
                  className="text-sm resize-none"
                  rows={3}
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <p className="text-xs text-stone-400">
          {t('cartSummary', { count: items.length })}
        </p>

        <Button
          type="submit"
          className="w-full gap-2"
          disabled={form.formState.isSubmitting || items.length === 0}
        >
          <Send className="h-4 w-4" />
          {form.formState.isSubmitting ? t('submitting') : t('submit')}
        </Button>
      </form>
    </Form>
  )
}
