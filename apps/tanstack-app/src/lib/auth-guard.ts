import { redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import type { AppUser } from '@libs/permissions'
import { safeReturnTo } from '@/lib/auth-navigation'

/**
 * Server function to get the current user's session.
 * Works both during SSR and client-side navigation (via RPC).
 */
const getAuthSession = createServerFn({ method: 'GET' }).handler(async () => {
  const { withDbContext } = await import('@/lib/with-request-db')
  return withDbContext(async () => {
    try {
      const { getRequest } = await import('@tanstack/react-start/server')
      const { auth } = await import('@libs/auth')
      const request = getRequest()
      const session = await auth.api.getSession({
        headers: new Headers(request.headers),
      })
      return {
        user: session?.user && !session.user.isAnonymous
          ? { id: session.user.id, role: session.user.role }
          : null,
      }
    } catch (error) {
      console.error('[auth-guard] getAuthSession failed:', error)
      return { user: null }
    }
  })
})

/**
 * Server function to get auth + subscription access state.
 * Works for SSR and client-side navigation (via RPC).
 */
const getSubscriptionAccess = createServerFn({ method: 'GET' }).handler(async () => {
  const { withDbContext } = await import('@/lib/with-request-db')
  return withDbContext(async () => {
    try {
      const { getRequest } = await import('@tanstack/react-start/server')
      const { auth } = await import('@libs/auth')
      const { checkSubscriptionStatus } = await import('@libs/database/utils/subscription')
      const request = getRequest()
      const session = await auth.api.getSession({
        headers: new Headers(request.headers),
      })

      if (!session?.user || session.user.isAnonymous) {
        return { user: null, hasSubscription: false }
      }

      const sub = await checkSubscriptionStatus(session.user.id)
      return {
        user: { id: session.user.id, role: session.user.role },
        hasSubscription: !!sub,
      }
    } catch (error) {
      console.error('[auth-guard] getSubscriptionAccess failed:', error)
      return { user: null, hasSubscription: false }
    }
  })
})

/**
 * Redirect authenticated users away from auth pages (signin, signup, etc.)
 * to the home page. Use in `beforeLoad` of auth routes.
 */
export async function redirectIfAuthenticated(returnTo?: unknown) {
  const result = await getAuthSession()
  if (result?.user) {
    throw redirect({
      href: safeReturnTo(returnTo),
    })
  }
}

/**
 * Require authentication. Redirects to signin if no session.
 * Use in `beforeLoad` of protected routes.
 */
export async function requireAuth() {
  const result = await getAuthSession()
  const user = result?.user
  if (!user) {
    throw redirect({
      to: '/signin',
    })
  }
  return { user }
}

/**
 * Require admin role. Redirects to signin or home page.
 * Use in `beforeLoad` of admin routes.
 */
export async function requireAdmin() {
  const { user } = await requireAuth()
  const { can, Action, Subject, Role } = await import('@libs/permissions')
  const appUser = {
    ...user,
    role: (user.role as (typeof Role)[keyof typeof Role]) || Role.NORMAL,
  } as AppUser

  if (!can(appUser, Action.MANAGE, Subject.ALL)) {
    throw redirect({
      to: '/',
    })
  }

  return { user }
}

/**
 * Require active subscription. Redirects to signin or home.
 * Use in `beforeLoad` of subscription-protected routes.
 */
export async function requireSubscription() {
  const result = await getSubscriptionAccess()
  if (!result?.user) {
    throw redirect({
      to: '/signin',
    })
  }

  if (!result.hasSubscription) {
    throw redirect({
      to: '/',
    })
  }

  return { user: result.user }
}
