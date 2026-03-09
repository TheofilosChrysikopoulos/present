'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslations, useLocale } from 'next-intl'
import { toast } from 'sonner'
import { Mail, UserPlus, CheckCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useAuthModal } from '@/lib/auth/authModalContext'
import { cn } from '@/lib/utils'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

const registerSchema = z.object({
  first_name: z.string().min(2, 'First name must be at least 2 characters'),
  last_name: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  location: z.string().min(2, 'Location is required'),
})

type LoginFormValues = z.infer<typeof loginSchema>
type RegisterFormValues = z.infer<typeof registerSchema>

export function AuthModal() {
  const t = useTranslations('auth')
  const locale = useLocale()
  const { isOpen, tab, close, setTab } = useAuthModal()

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
        <DialogTitle className="sr-only">
          {tab === 'login' ? t('loginTitle') : t('registerTitle')}
        </DialogTitle>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setTab('login')}
            className={cn(
              'flex-1 px-4 py-3 text-sm font-medium transition-colors text-center',
              tab === 'login'
                ? 'text-[#1e3a5f] border-b-2 border-[#1e3a5f] bg-white'
                : 'text-slate-400 hover:text-slate-600 bg-slate-50'
            )}
          >
            {t('login')}
          </button>
          <button
            onClick={() => setTab('register')}
            className={cn(
              'flex-1 px-4 py-3 text-sm font-medium transition-colors text-center',
              tab === 'register'
                ? 'text-[#1e3a5f] border-b-2 border-[#1e3a5f] bg-white'
                : 'text-slate-400 hover:text-slate-600 bg-slate-50'
            )}
          >
            {t('register')}
          </button>
        </div>

        <div className="p-6">
          {tab === 'login' ? (
            <LoginForm onSwitchToRegister={() => setTab('register')} />
          ) : (
            <RegisterForm onSwitchToLogin={() => setTab('login')} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function LoginForm({ onSwitchToRegister }: { onSwitchToRegister: () => void }) {
  const t = useTranslations('auth')
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
      <div className="text-center py-4">
        <div className="mx-auto w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mb-3">
          <Mail className="h-7 w-7 text-blue-600" />
        </div>
        <h3 className="text-lg font-bold text-[#1e3a5f] mb-1">
          {t('checkEmail')}
        </h3>
        <p className="text-sm text-slate-500 mb-1">
          {t('checkEmailHint')}
        </p>
        <p className="text-xs text-slate-400 font-mono mb-4">{sentEmail}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setEmailSent(false)
            form.reset()
          }}
        >
          {t('tryDifferentEmail')}
        </Button>
      </div>
    )
  }

  return (
    <div>
      <div className="text-center mb-5">
        <div className="mx-auto w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-3">
          <Mail className="h-5 w-5 text-slate-600" />
        </div>
        <h3 className="text-lg font-bold text-[#1e3a5f]">{t('loginTitle')}</h3>
        <p className="text-xs text-slate-500 mt-0.5">{t('loginSubtitle')}</p>
      </div>

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
        <button
          onClick={onSwitchToRegister}
          className="text-[#1e3a5f] font-medium hover:underline"
        >
          {t('registerLink')}
        </button>
      </p>
    </div>
  )
}

function RegisterForm({ onSwitchToLogin }: { onSwitchToLogin: () => void }) {
  const t = useTranslations('auth')
  const { close } = useAuthModal()
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
      <div className="text-center py-4">
        <div className="mx-auto w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mb-3">
          <CheckCircle className="h-7 w-7 text-green-600" />
        </div>
        <h3 className="text-lg font-bold text-[#1e3a5f] mb-1">
          {t('registerSuccess')}
        </h3>
        <p className="text-sm text-slate-500 mb-4">{t('registerSuccessHint')}</p>
        <Button variant="outline" size="sm" onClick={close}>
          {t('backToHome')}
        </Button>
      </div>
    )
  }

  return (
    <div>
      <div className="text-center mb-5">
        <div className="mx-auto w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-3">
          <UserPlus className="h-5 w-5 text-slate-600" />
        </div>
        <h3 className="text-lg font-bold text-[#1e3a5f]">{t('registerTitle')}</h3>
        <p className="text-xs text-slate-500 mt-0.5">{t('registerSubtitle')}</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
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
        <button
          onClick={onSwitchToLogin}
          className="text-[#1e3a5f] font-medium hover:underline"
        >
          {t('loginLink')}
        </button>
      </p>
    </div>
  )
}
