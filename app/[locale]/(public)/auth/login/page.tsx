'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import { toast } from 'sonner'
import { Mail, CheckCircle } from 'lucide-react'
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

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const t = useTranslations('auth')
  const locale = useLocale()
  const base = `/${locale}`
  const [emailSent, setEmailSent] = useState(false)
  const [sentEmail, setSentEmail] = useState('')

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '' },
  })

  async function onSubmit(values: LoginFormValues) {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error ?? t('loginError'))
        return
      }

      setSentEmail(values.email)
      setEmailSent(true)
    } catch {
      toast.error(t('loginError'))
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
            <Mail className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-[#1e3a5f] mb-2">
            {t('checkEmail')}
          </h1>
          <p className="text-slate-500 mb-2">
            {t('checkEmailHint')}
          </p>
          <p className="text-sm text-slate-400 font-mono mb-6">{sentEmail}</p>
          <Button
            variant="outline"
            onClick={() => {
              setEmailSent(false)
              form.reset()
            }}
          >
            {t('tryDifferentEmail')}
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
            <Mail className="h-6 w-6 text-slate-600" />
          </div>
          <h1 className="text-2xl font-bold text-[#1e3a5f]">{t('loginTitle')}</h1>
          <p className="text-sm text-slate-500 mt-1">{t('loginSubtitle')}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('email')}</FormLabel>
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

              <Button
                type="submit"
                className="w-full bg-[#BFDBFE] hover:bg-[#93C5FD] text-[#1e3a5f] border-0"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? t('sendingLink') : t('sendMagicLink')}
              </Button>
            </form>
          </Form>

          <p className="text-sm text-slate-500 text-center mt-4">
            {t('noAccount')}{' '}
            <Link
              href={`${base}/auth/register`}
              className="text-[#1e3a5f] font-medium hover:underline"
            >
              {t('registerLink')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
