import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { seoHead } from '@/lib/seo'
import { legalPages, legalDetails } from '@/lib/legal-copy'
import { useAuthCapabilities } from '@/hooks/use-auth-capabilities'
import { authCopy } from '@/lib/auth-copy'
import { validateAuthSearch, useAuthReturnTo } from '@/lib/auth-navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@libs/react-shared/ui/card'
import { Button } from '@libs/react-shared/ui/button'
import { Input } from '@libs/react-shared/ui/input'
import { Label } from '@libs/react-shared/ui/label'
import { FormError } from '@libs/react-shared/ui/form-error'
import { Turnstile } from '@libs/react-shared/ui/turnstile'
import { Loader2 } from 'lucide-react'
import { createValidators } from '@libs/validators'
import { authClientReact } from '@libs/auth/authClient'
import type { z } from 'zod'
import { useTranslation } from '@/hooks/use-translation'
import { config } from '@config'

export const Route = createFileRoute('/(auth)/forgot-password')({
  validateSearch: validateAuthSearch,
  head: () => seoHead({ title: 'Forgot password', description: 'Request a secure password reset link for your account.', canonical: '/forgot-password' }),
  component: ForgotPasswordPage,
})

function ForgotPasswordPage() {
  const { t, locale, tWithParams } = useTranslation()
  const { passwordResetEnabled } = useAuthCapabilities()
  const returnTo = useAuthReturnTo()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<{
    code?: string
    message: string
  } | null>(null)
  const [emailSent, setEmailSent] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [turnstileKey, setTurnstileKey] = useState(0)

  const { forgetPasswordSchema } = createValidators(tWithParams)

  type FormData = z.infer<typeof forgetPasswordSchema>

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(forgetPasswordSchema),
    defaultValues: { email: '' },
    mode: 'onBlur',
  })

  const onSubmit = async (data: FormData) => {
    if (!passwordResetEnabled) return
    if (config.captcha.enabled && !turnstileToken) {
      setError({
        code: 'CAPTCHA_REQUIRED',
        message: t.auth.forgetPassword.errors.captchaRequired,
      })
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { error } = await authClientReact.requestPasswordReset({
        email: data.email,
        redirectTo: '/reset-password',
        fetchOptions: {
          headers: {
            'X-Locale': locale,
            ...(config.captcha.enabled && turnstileToken
              ? { 'x-captcha-response': turnstileToken }
              : {}),
          },
        },
      })

      if (error) {
        setError({
          code: error.code || 'UNKNOWN_ERROR',
          message: error.message || t.common.unexpectedError,
        })
        if (config.captcha.enabled) {
          setTurnstileToken(null)
          setTurnstileKey((prev) => prev + 1)
        }
        setLoading(false)
        return
      }

      setEmailSent(true)
    } catch {
      setError({ message: authCopy.requestFailed })
    } finally {
      setLoading(false)
    }
  }

  if (!passwordResetEnabled) return (
    <Card className="w-full">
      <CardHeader className="text-center"><h1 className="text-xl font-semibold">{t.auth.forgetPassword.title}</h1></CardHeader>
      <CardContent className="space-y-4 text-sm">
        <p>{authCopy.resetUnavailable}</p>
        <p><a className="underline underline-offset-4" href={`mailto:${legalDetails.supportEmail}`}>{legalDetails.supportEmail}</a></p>
        <Link to="/signin" search={{ returnTo }} className="block underline underline-offset-4">{authCopy.backToSignin}</Link>
      </CardContent>
    </Card>
  )

  return (
    <Card className="w-full">
      {!emailSent ? (
        <>
          <CardHeader className="text-center">
            <h1 className="text-xl font-semibold">
              {t.auth.forgetPassword.title}
            </h1>
            <CardDescription>
              {t.auth.forgetPassword.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">
                    {t.auth.forgetPassword.email}
                  </Label>
                  <Input
                    id="email"
                    placeholder={t.auth.forgetPassword.emailPlaceholder}
                    type="email"
                    autoCapitalize="none"
                    autoComplete="email"
                    autoCorrect="off"
                    disabled={loading}
                    {...register('email')}
                  />
                  {errors?.email && (
                    <p className="px-1 text-xs text-red-600">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <Turnstile
                  key={turnstileKey}
                  onSuccess={(token: string) => setTurnstileToken(token)}
                  onError={() => setTurnstileToken(null)}
                  onExpire={() => setTurnstileToken(null)}
                />

                <Button
                  disabled={
                    loading ||
                    (config.captcha.enabled && !turnstileToken)
                  }
                >
                  {loading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {loading
                    ? t.auth.forgetPassword.submitting
                    : t.auth.forgetPassword.submit}
                </Button>
              </div>
            </form>
            {error && (
              <FormError message={error.message} />
            )}
            <Link to="/signin" search={{ returnTo }} className="text-center text-sm underline underline-offset-4">{authCopy.backToSignin}</Link>
            <div className="text-muted-foreground *:[a]:hover:text-primary text-balance text-center text-xs *:[a]:underline *:[a]:underline-offset-4">
              {t.auth.forgetPassword.termsNotice}{' '}
              <a href={legalPages.terms.path}>{legalPages.terms.label}</a>{' '}
              {t.common.and}{' '}
              <a href={legalPages.privacy.path}>{legalPages.privacy.label}</a>.
            </div>
          </CardContent>
        </>
      ) : (
        <div className="space-y-4 text-center p-6">
          <h1 className="text-xl font-semibold">
            {t.auth.forgetPassword.verification.title}
          </h1>
          <p className="text-muted-foreground">
            {authCopy.resetSent}
          </p>
          <Link to="/signin" search={{ returnTo }} className="block text-sm underline underline-offset-4">{authCopy.backToSignin}</Link>
          <p className="text-muted-foreground text-sm">
            {t.auth.forgetPassword.verification.checkSpam}
          </p>
        </div>
      )}
    </Card>
  )
}
