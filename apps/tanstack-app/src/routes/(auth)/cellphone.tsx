import { createFileRoute, Link } from '@tanstack/react-router'
import { seoHead } from '@/lib/seo'
import { legalPages } from '@/lib/legal-copy'
import { PhoneLoginForm } from '@/components/phone-login-form'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@libs/react-shared/ui/card'
import { useTranslation } from '@/hooks/use-translation'
import { useAuthCapabilities } from '@/hooks/use-auth-capabilities'
import { authCopy } from '@/lib/auth-copy'
import { validateAuthSearch, useAuthReturnTo } from '@/lib/auth-navigation'

export const Route = createFileRoute('/(auth)/cellphone')({
  validateSearch: validateAuthSearch,
  head: () => seoHead({ title: 'Phone sign in', description: 'Sign in to your account using phone verification.', canonical: '/cellphone' }),
  component: CellphonePage,
})

function CellphonePage() {
  const { t } = useTranslation()
  const { socialProviders } = useAuthCapabilities()
  const returnTo = useAuthReturnTo()
  const available = socialProviders.includes('phone')

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <h1 className="text-xl font-semibold">{t.auth.phone.title}</h1>
        <CardDescription>{available ? t.auth.phone.description : authCopy.unavailableProvider}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {available && <PhoneLoginForm />}
        <div className="text-muted-foreground text-balance text-center text-xs [&_a:hover]:text-primary [&_a]:underline [&_a]:underline-offset-4">
          {t.auth.phone.termsNotice}{' '}
          <a href={legalPages.terms.path}>{legalPages.terms.label}</a>{' '}
          {t.common.and} <a href={legalPages.privacy.path}>{legalPages.privacy.label}</a>.
        </div>
        <div className="flex justify-center gap-4 text-sm">
          <Link
            to="/signin"
            search={{ returnTo }}
            className="text-primary hover:underline"
          >
            {t.auth.signin.title}
          </Link>
          <span className="text-muted-foreground">|</span>
          <Link
            to="/signup"
            search={{ returnTo }}
            className="text-primary hover:underline"
          >
            {t.auth.signup.createAccount}
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
