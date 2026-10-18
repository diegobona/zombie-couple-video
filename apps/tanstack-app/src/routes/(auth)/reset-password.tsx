import { useState } from 'react'
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { seoHead } from '@/lib/seo'
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
import { Loader2 } from 'lucide-react'
import { createValidators } from '@libs/validators'
import { authClientReact } from '@libs/auth/authClient'
import type { z } from 'zod'
import { useTranslation } from '@/hooks/use-translation'
import { authCopy } from '@/lib/auth-copy'

export const Route = createFileRoute('/(auth)/reset-password')({
  validateSearch: (search: Record<string, unknown>): { token?: string } => ({ token: typeof search.token === 'string' ? search.token : undefined }),
  head: () => seoHead({ title: 'Reset password', description: 'Set a new secure password using your password reset link.', canonical: '/reset-password' }),
  component: ResetPasswordPage,
})

function ResetPasswordPage() {
  const navigate = useNavigate()
  const { t, tWithParams } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<{
    code?: string
    message: string
  } | null>(null)
  const [resetSuccess, setResetSuccess] = useState(false)
  const { token } = Route.useSearch()

  const { resetPasswordSchema } = createValidators(tWithParams)

  type FormData = z.infer<typeof resetPasswordSchema>

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
    mode: 'onBlur',
  })

  const onSubmit = async (data: FormData) => {
    if (!token) return

    setLoading(true)
    setError(null)

    try {
      const { error } = await authClientReact.resetPassword({
        newPassword: data.password,
        token,
      })

      if (error) {
        setError({
          code: error.code || 'UNKNOWN_ERROR',
          message: error.message || t.common.unexpectedError,
        })
        setLoading(false)
        return
      }

      setResetSuccess(true)
    } catch {
      setError({ message: authCopy.requestFailed })
    } finally {
      setLoading(false)
    }
  }

  if (!token) return (
    <Card className="w-full">
      <CardHeader><h1 className="text-center text-xl font-semibold">{t.auth.resetPassword.title}</h1></CardHeader>
      <CardContent className="space-y-4 text-sm">
        <p>{authCopy.resetInvalid}</p>
        <Link to="/forgot-password" className="block underline underline-offset-4">{authCopy.requestReset}</Link>
        <Link to="/signin" className="block underline underline-offset-4">{authCopy.backToSignin}</Link>
      </CardContent>
    </Card>
  )

  return (
    <Card className="w-full">
      {!resetSuccess ? (
        <>
          <CardHeader className="text-center">
            <h1 className="text-xl font-semibold">
              {t.auth.resetPassword.title}
            </h1>
            <CardDescription>
              {t.auth.resetPassword.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="password">
                    {t.auth.resetPassword.password}
                  </Label>
                  <Input
                    id="password"
                    placeholder={t.auth.resetPassword.passwordPlaceholder}
                    type="password"
                    autoComplete="new-password"
                    disabled={loading}
                    {...register('password')}
                  />
                  {errors?.password && (
                    <p className="px-1 text-xs text-red-600">
                      {errors.password.message}
                    </p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword">
                    {t.auth.resetPassword.confirmPassword}
                  </Label>
                  <Input
                    id="confirmPassword"
                    placeholder={
                      t.auth.resetPassword.confirmPasswordPlaceholder
                    }
                    type="password"
                    autoComplete="new-password"
                    disabled={loading}
                    {...register('confirmPassword')}
                  />
                  {errors?.confirmPassword && (
                    <p className="px-1 text-xs text-red-600">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>
                <Button disabled={loading || !token}>
                  {loading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {loading
                    ? t.auth.resetPassword.submitting
                    : t.auth.resetPassword.submit}
                </Button>
              </div>
            </form>
            {error && (
              <FormError message={error.message} />
            )}
            <Link to="/forgot-password" className="text-sm underline underline-offset-4">{authCopy.requestReset}</Link>
          </CardContent>
        </>
      ) : (
        <div className="space-y-4 text-center p-6">
          <h1 className="text-xl font-semibold">
            {t.auth.resetPassword.success.title}
          </h1>
          <p className="text-muted-foreground">
            {t.auth.resetPassword.success.description}
          </p>
          <Button
            onClick={() =>
              navigate({
                to: '/signin',
              })
            }
          >
            {t.auth.resetPassword.success.goToSignIn}
          </Button>
        </div>
      )}
    </Card>
  )
}
