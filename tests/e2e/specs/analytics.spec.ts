import { expect, test, type BrowserContext } from '@playwright/test'
import { gunzipSync } from 'node:zlib'

const origin = 'https://zombie-couple-video.net'
type Captured = { event: string; properties: Record<string, unknown> }

function decodeEvents(buffer: Buffer): Captured[] {
  let text = (buffer[0] === 31 && buffer[1] === 139 ? gunzipSync(buffer) : buffer).toString('utf8')
  if (!/^[\[{]/.test(text)) {
    const data = new URLSearchParams(text).get('data')
    if (data) text = Buffer.from(data, 'base64').toString('utf8')
  }
  const json = JSON.parse(text)
  return Array.isArray(json) ? json : Array.isArray(json.batch) ? json.batch : [json]
}

async function mockTrial(context: BrowserContext) {
  await context.route('**/api/video-generate/', route => route.fulfill({
    json: { success: true, data: { state: 'available', taskId: null, storageKey: 'analytics-test' } },
  }))
}

test('page loads preserve AI attribution and the website host without tracking actions', async ({ page, context, baseURL }) => {
  const events: Captured[] = []
  const unexpected: string[] = []
  // The SDK excludes WebDriver; simulate a human only in this intercepted test.
  await context.addInitScript(() => Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false }))
  await context.route(`${origin}/**`, async route => {
    const url = new URL(route.request().url())
    const response = await route.fetch({ url: `${baseURL}${url.pathname}${url.search}` })
    await route.fulfill({ response })
  })
  await context.route(/^https:\/\/[^/]*\.posthog\.com\//, async route => {
    const request = route.request()
    const url = new URL(request.url())
    if (request.method() === 'POST' && /\/(?:e|batch)\//.test(url.pathname)) {
      expect(url.origin).toBe('https://us.i.posthog.com')
      events.push(...decodeEvents(request.postDataBuffer()!))
    } else unexpected.push(url.pathname)
    await route.fulfill({ status: 200, json: { status: 1 } })
  })
  await mockTrial(context)
  await page.goto(`${origin}/?utm_source=chatgpt&utm_medium=ai&private_test=do-not-send#private-fragment`, {
    referer: 'https://chatgpt.com/c/private-conversation?private-referrer=hidden',
  })
  await expect(page.locator('h1')).toHaveText('Zombie Couple Video')
  await expect.poll(() => events.length, { timeout: 10000 }).toBe(1)
  expect(events[0].event).toBe('$pageview')
  expect(events[0].properties.$host).toBe('zombie-couple-video.net')
  expect(events[0].properties.$referring_domain).toBe('chatgpt.com')
  expect(events[0].properties.utm_source).toBe('chatgpt')
  expect(events[0].properties.utm_medium).toBe('ai')
  expect(String(events[0].properties.distinct_id)).not.toBe('undefined')
  await page.getByTestId('zombie-maker').getByRole('checkbox').check()
  await page.evaluate(() => window.history.pushState({}, '', '/?utm_source=chatgpt&utm_medium=ai'))
  // The queue flushes on navigation; neither click nor History navigation adds events.
  await page.reload()
  await expect.poll(() => events.length, { timeout: 10000 }).toBe(2)
  expect(events.map(event => event.event)).toEqual(['$pageview', '$pageview'])
  expect(events[0].properties.distinct_id).toBe(events[1].properties.distinct_id)
  expect(unexpected).toEqual([])
  for (const value of ['private_test', 'do-not-send', 'private-fragment', 'private-conversation', 'private-referrer']) {
    expect(JSON.stringify(events)).not.toContain(value)
  }
})

test('localhost is excluded and the privacy disclosure describes analytics', async ({ page, context }) => {
  const requests: string[] = []
  await context.addInitScript(() => Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false }))
  await context.route(/^https:\/\/[^/]*\.posthog\.com\//, async route => {
    requests.push(route.request().url())
    await route.fulfill({ json: { status: 1 } })
  })
  await mockTrial(context)
  const response = await page.goto('/')
  expect(response?.status()).toBe(200)
  expect(await response!.text()).toContain('Zombie Couple Video')
  await page.getByRole('navigation', { name: 'Legal information' }).getByRole('link', { name: 'Privacy Policy', exact: true }).click()
  await expect(page.locator('h1')).toHaveText('Privacy Policy')
  await expect(page.locator('main')).toContainText('We use PostHog for basic visit and referral-source statistics')
  await expect(page.locator('main')).toContainText('Its US-hosted service')
  await page.screenshot({ path: 'test-results/posthog-privacy.png', fullPage: true })
  await page.goto('/')
  await expect(page.getByTestId('zombie-maker').getByRole('checkbox')).toBeVisible()
  await page.screenshot({ path: 'test-results/posthog-homepage.png' })
  await page.waitForTimeout(1500)
  expect(requests).toEqual([])
})
