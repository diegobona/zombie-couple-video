import { createFileRoute } from '@tanstack/react-router'
import { seoHead } from '@/lib/seo'
import { legalPages } from '@/lib/legal-copy'
import { LoginForm } from '@/components/login-form'
import { SocialAuth } from '@/components/social-auth'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@libs/react-shared/ui/card'
import { useTranslation } from '@/hooks/use-translation'
import { useAuthCapabilities } from '@/hooks/use-auth-capabilities'
import { authCopy } from '@/lib/auth-copy'
import { validateAuthSearch } from '@/lib/auth-navigation'

export const Route = createFileRoute('/(auth)/signin')({
  validateSearch: validateAuthSearch,
  head: () => seoHead({ title: 'Sign in', description: authCopy.signinDescription, canonical: '/signin' }),
  component: SigninPage,
})

function SigninPage() {
  const { t } = useTranslation()
  const { socialProviders } = useAuthCapabilities()

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <h1 className="text-xl font-semibold">{t.auth.signin.welcomeBack}</h1>
        <CardDescription>{authCopy.signinDescription}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <SocialAuth />
        {socialProviders.length > 0 && <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
          <span className="bg-card text-muted-foreground relative z-10 px-2">
            {t.auth.signin.continueWith}
          </span>
        </div>}
        <div className="flex flex-col gap-4">
          <LoginForm />
        </div>
        <div className="text-muted-foreground *:[a]:hover:text-primary text-balance text-center text-xs *:[a]:underline *:[a]:underline-offset-4">
          {t.auth.signin.termsNotice}{' '}
          <a href={legalPages.terms.path}>{legalPages.terms.label}</a>{' '}
          {t.common.and} <a href={legalPages.privacy.path}>{legalPages.privacy.label}</a>.
        </div>
      </CardContent>
    </Card>
  )
}
