import { useEffect } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { seoHead } from '@/lib/seo'
import { legalPages } from '@/lib/legal-copy'
import { useTranslation } from '@/hooks/use-translation'
import { useAuthCapabilities } from '@/hooks/use-auth-capabilities'
import { authCopy } from '@/lib/auth-copy'
import { validateAuthSearch, useAuthReturnTo } from '@/lib/auth-navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@libs/react-shared/ui/card'

declare global {
  interface Window {
    WxLogin: any
  }
}

export const Route = createFileRoute('/(auth)/wechat')({
  validateSearch: validateAuthSearch,
  head: () => seoHead({ title: 'WeChat sign in', description: 'Sign in to your account using WeChat.', canonical: '/wechat' }),
  component: WechatLoginPage,
})

function WechatLoginPage() {
  const { t } = useTranslation()
  const { socialProviders, wechatAppId } = useAuthCapabilities()
  const available = socialProviders.includes('wechat')
  const returnTo = useAuthReturnTo()

  useEffect(() => {
    if (!available) return
    const script = document.createElement('script')
    script.src =
      'https://res.wx.qq.com/connect/zh_CN/htmledition/js/wxLogin.js'
    script.async = true
    script.onload = () => {
      if (typeof window.WxLogin !== 'undefined') {
        const stateData = btoa(encodeURIComponent(returnTo))

        new window.WxLogin({
          id: 'login_container',
          appid: wechatAppId,
          scope: 'snsapi_login',
          redirect_uri: encodeURIComponent(
            `${window.location.origin}/api/auth/oauth2/callback/wechat`
          ),
          state: stateData,
          style: 'black',
        })
      }
    }
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [available, wechatAppId, returnTo])

  return (
    <div className="container flex min-h-screen items-center justify-center py-6">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <h1 className="text-center text-2xl font-semibold">
            {t.auth.wechat.title}
          </h1>
          <CardDescription className="text-center">
            {available ? t.auth.wechat.description : authCopy.unavailableProvider}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            {available && <div className="relative">
              <div
                id="login_container"
                className="flex min-h-[300px] items-center justify-center"
              >
                <div className="text-muted-foreground text-center">
                  {t.auth.wechat.loadingQRCode}
                </div>
              </div>
            </div>}
            <div className="text-muted-foreground text-balance text-center text-xs [&_a:hover]:text-primary [&_a]:underline [&_a]:underline-offset-4">
              {t.auth.wechat.termsNotice}{' '}
              <a href={legalPages.terms.path}>{legalPages.terms.label}</a>{' '}
              {t.common.and}{' '}
              <a href={legalPages.privacy.path}>{legalPages.privacy.label}</a>.
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
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
