import { createFileRoute } from '@tanstack/react-router'
import { seoHead } from '@/lib/seo'
import { legalPages } from '@/lib/legal-copy'
import { SignupForm } from '@/components/signup-form'
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

export const Route = createFileRoute('/(auth)/signup')({
  validateSearch: validateAuthSearch,
  head: () => seoHead({ title: 'Create account', description: authCopy.signupDescription, canonical: '/signup' }),
  component: SignupPage,
})

function SignupPage() {
  const { t } = useTranslation()
  const { socialProviders } = useAuthCapabilities()

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <h1 className="text-xl font-semibold">
          {t.auth.signup.createAccount}
        </h1>
        <CardDescription>{authCopy.signupDescription}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <SocialAuth />
        {socialProviders.length > 0 && <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
          <span className="bg-card text-muted-foreground relative z-10 px-2">
            {t.auth.signup.continueWith}
          </span>
        </div>}
        <SignupForm />
        <div className="text-muted-foreground *:[a]:hover:text-primary text-balance text-center text-xs *:[a]:underline *:[a]:underline-offset-4">
          {t.auth.signup.termsNotice}{' '}
          <a href={legalPages.terms.path}>{legalPages.terms.label}</a>{' '}
          {t.common.and} <a href={legalPages.privacy.path}>{legalPages.privacy.label}</a>.
        </div>
      </CardContent>
    </Card>
  )
}
