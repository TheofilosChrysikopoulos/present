'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import { useCart } from '@/hooks/useCart'
import { useUser } from '@/hooks/useUser'
import type { EnquiryCartItem } from '@/lib/types'

const enquirySchema = z.object({
  message: z.string().optional(),
})

type EnquiryFormValues = z.infer<typeof enquirySchema>

export function EnquiryForm() {
  const t = useTranslations('enquiry')
  const { items, clearCart } = useCart()
  const { customer } = useUser()
  const [submitted, setSubmitted] = useState(false)

  const form = useForm<EnquiryFormValues>({
    resolver: zodResolver(enquirySchema),
    defaultValues: {
      message: '',
    },
  })

  async function onSubmit(values: EnquiryFormValues) {
    if (!customer) return

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
      size_id: item.size?.id,
      size_label_en: item.size?.labelEn,
      size_label_el: item.size?.labelEl,
    }))

    try {
      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: values.message,
          cart_snapshot: cartSnapshot,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Request failed')
      }

      setSubmitted(true)
      toast.success(t('success'))
    } catch {
      toast.error(t('error'))
    }
  }

  if (submitted) {
    return (
      <div className="py-4 text-center">
        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
          <Send className="h-5 w-5 text-green-600" />
        </div>
        <p className="text-sm text-slate-700 font-medium">{t('success')}</p>
        <button
          onClick={() => {
            setSubmitted(false)
            clearCart()
          }}
          className="mt-3 text-xs text-slate-400 hover:text-slate-600 underline"
        >
          {t('continueShopping')}
        </button>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <h2 className="font-semibold text-[#1e3a5f] mb-1">{t('title')}</h2>
        <p className="text-xs text-slate-500 mb-3">{t('subtitle')}</p>

        {/* Show logged-in user info */}
        {customer && (
          <div className="bg-slate-50 rounded-lg px-3 py-2 text-sm text-slate-600 space-y-0.5">
            <p className="font-medium text-slate-800">
              {customer.first_name} {customer.last_name}
            </p>
            <p className="text-xs">{customer.email}</p>
            <p className="text-xs">{customer.location}</p>
          </div>
        )}

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

        <p className="text-xs text-slate-400">
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
