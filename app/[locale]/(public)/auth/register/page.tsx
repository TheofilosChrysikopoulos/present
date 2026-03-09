'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import { toast } from 'sonner'
import { UserPlus, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

const registerSchema = z.object({
  first_name: z.string().min(2, 'First name must be at least 2 characters'),
  last_name: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  location: z.string().min(2, 'Location is required'),
})

type RegisterFormValues = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const t = useTranslations('auth')
  const locale = useLocale()
  const base = `/${locale}`
  const [submitted, setSubmitted] = useState(false)

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      location: '',
    },
  })

  async function onSubmit(values: RegisterFormValues) {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error ?? t('registerError'))
        return
      }

      const data = await res.json()

      // Auto-login: redirect to the magic link callback URL
      if (data.autoLoginUrl) {
        window.location.href = data.autoLoginUrl
        return
      }

      setSubmitted(true)
    } catch {
      toast.error(t('registerError'))
    }
  }

  if (submitted) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-[#1e3a5f] mb-2">
            {t('registerSuccess')}
          </h1>
          <p className="text-slate-500 mb-6">{t('registerSuccessHint')}</p>
          <Button asChild variant="outline">
            <Link href={`${base}/`}>{t('backToHome')}</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <UserPlus className="h-6 w-6 text-slate-600" />
          </div>
          <h1 className="text-2xl font-bold text-[#1e3a5f]">{t('registerTitle')}</h1>
          <p className="text-sm text-slate-500 mt-1">{t('registerSubtitle')}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('firstName')} *</FormLabel>
                      <FormControl>
                        <Input placeholder={t('firstNamePlaceholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('lastName')} *</FormLabel>
                      <FormControl>
                        <Input placeholder={t('lastNamePlaceholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('email')} *</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder={t('emailPlaceholder')}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('location')} *</FormLabel>
                    <FormControl>
                      <Input placeholder={t('locationPlaceholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full bg-[#BFDBFE] hover:bg-[#93C5FD] text-[#1e3a5f] border-0"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? t('registering') : t('register')}
              </Button>
            </form>
          </Form>

          <p className="text-sm text-slate-500 text-center mt-4">
            {t('haveAccount')}{' '}
            <Link
              href={`${base}/auth/login`}
              className="text-[#1e3a5f] font-medium hover:underline"
            >
              {t('loginLink')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
