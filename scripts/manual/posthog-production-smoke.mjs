// One direct installation-check visit; never fabricate a live AI referral.
import { chromium, request } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'

const origin = 'https://zombie-couple-video.net'
const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined
const api = await request.newContext({ proxy })
await mkdir('test-results', { recursive: true })
const homepage = await api.get(origin)
const html = await homepage.text()
const privacy = await api.get(`${origin}/privacy-policy`)
const privacyHtml = await privacy.text()
const browser = await chromium.launch({ channel: 'msedge', headless: true, proxy })
try {
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0',
  })
  // PostHog intentionally excludes WebDriver; check our own installation as a visitor.
  await context.addInitScript(() => Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false }))
  await context.route('**/api/video-generate/', route => route.fulfill({
    json: { success: true, data: { state: 'available', taskId: null, storageKey: 'analytics-check' } },
  }))
  const page = await context.newPage()
  const requests = []
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('request', request => {
    const url = new URL(request.url())
    if (url.hostname.endsWith('.posthog.com')) requests.push({ path: url.pathname, method: request.method() })
  })
  const ingestion = page.waitForResponse(response => {
    const url = new URL(response.url())
    return url.hostname === 'us.i.posthog.com' && response.request().method() === 'POST' && /\/(?:e|batch)\//.test(url.pathname)
  }, { timeout: 20000 })
  await page.goto(origin, { waitUntil: 'domcontentloaded' })
  const ingested = await ingestion
  const acknowledgement = await ingested.json().catch(() => null)
  await page.screenshot({ path: 'test-results/posthog-production-homepage.png' })
  const report = {
    checkedAt: new Date().toISOString(), origin, projectId: 666244,
    homepageStatus: homepage.status(),
    ssrH1: html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1].replace(/<[^>]*>/g, ''),
    privacyStatus: privacy.status(),
    privacyMentionsPostHog: privacyHtml.includes('We use PostHog for basic visit and referral-source statistics'),
    ingestionStatus: ingested.status(),
    accepted: ingested.ok() && ['1', 'ok', 'success'].includes(String(acknowledgement?.status ?? acknowledgement).toLowerCase()),
    ingestionAcknowledgement: acknowledgement, analyticsRequests: requests, pageErrors: errors,
    providerJobs: 0, testVisitSource: 'direct; installation verification',
  }
  await writeFile('test-results/posthog-production-smoke.json', JSON.stringify(report, null, 2) + '\n')
  console.log(JSON.stringify(report, null, 2))
  if (!report.accepted || report.homepageStatus !== 200 || report.privacyStatus !== 200 || report.ssrH1 !== 'Zombie Couple Video' || !report.privacyMentionsPostHog || errors.length) process.exitCode = 1
} finally {
  await browser.close()
  await api.dispose()
}
