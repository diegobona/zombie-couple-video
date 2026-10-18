import { createFileRoute } from '@tanstack/react-router'
import { seoHead } from '@/lib/seo'
import { siteCopy } from '@/lib/site-copy'
import { useTranslation } from '@/hooks/use-translation'
import { Button } from '@libs/react-shared/ui/button'
import { XCircle } from 'lucide-react'

export const Route = createFileRoute('/payment-cancel')({
  head: () => seoHead({ title: 'Payment cancelled', description: 'Your payment was cancelled. Return home to continue.', canonical: '/payment-cancel' }),
  component: PaymentCancelPage,
})

function PaymentCancelPage() {
  const { t } = useTranslation()

  return (
    <div className="container max-w-2xl py-20">
      <div className="flex flex-col items-center space-y-6 text-center">
        <div className="rounded-full bg-red-100 p-3">
          <XCircle className="h-12 w-12 text-red-600" />
        </div>

        <h1 className="text-3xl font-bold">{t.payment.result.cancel.title}</h1>

        <p className="text-muted-foreground">
          {t.payment.result.cancel.description}
        </p>

        <div className="flex flex-col gap-4 pt-6 sm:flex-row">
          <Button variant="ghost" asChild>
            <a href="/">
              {siteCopy.name}
            </a>
          </Button>
        </div>
      </div>
    </div>
  )
}
