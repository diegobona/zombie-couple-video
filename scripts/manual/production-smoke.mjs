import { chromium, request, expect } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'

const origin = 'https://zombie-couple-video.net'
const mediaOrigin = 'https://media.zombie-couple-video.net'
const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined
const api = await request.newContext({ baseURL: origin, proxy, extraHTTPHeaders: { Origin: origin }, timeout: 30_000 })
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6ru8AAAAASUVORK5CYII=', 'base64')
const evidence = { origin, pages: [], redirects: [], uploads: [], browser: [], providerJobs: 0, sampleContainsPersonalPhoto: false }
let browser
await mkdir('test-results', { recursive: true })
try {
  for (const path of ['/', '/privacy-policy', '/terms-of-service']) {
    const response = await api.get(path, { maxRedirects: 0 })
    expect(response.status()).toBe(200)
    const html = await response.text()
    expect(html).toContain('Zombie Couple Video')
    expect(html).not.toContain('Rumpelstiltskin')
    expect(html.match(/<h1\b/g)).toHaveLength(1)
    expect(html).toContain(`href="${origin}${path}"`)
    expect(html).toContain(path === '/' ? 'index, follow' : 'noindex, follow')
    evidence.pages.push({ path, status: response.status(), ssr: true, canonical: true })
  }
  for (const [url, target] of [
    ['http://zombie-couple-video.net/', `${origin}/`],
    ['https://www.zombie-couple-video.net/', `${origin}/`],
    [`${origin}/zombie-couple-video-generator`, `${origin}/`],
    [`${origin}/how-to-make-zombie-couple-video`, `${origin}/#how-to-make`],
  ]) {
    const response = await api.get(url, { maxRedirects: 0 })
    expect(response.status()).toBe(301)
    expect(new URL(response.headers().location, url).href).toBe(target)
    evidence.redirects.push({ url, status: response.status(), target })
  }
  expect((await api.get('/visitor-production-missing-page')).status()).toBe(404)
  expect(await (await api.get('/robots.txt')).text()).toContain(`Sitemap: ${origin}/sitemap.xml`)
  const sitemap = await (await api.get('/sitemap.xml')).text()
  expect([...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1])).toEqual([`${origin}/`])
  const trial = await api.get('/api/video-generate/', { maxRedirects: 0 })
  expect(trial.status()).toBe(200)
  expect((await trial.json()).data.state).toBe('available')
  const signIn = await api.post('/api/auth/sign-in/anonymous', { data: {} })
  expect(signIn.status()).toBe(200)
  const session = await (await api.get('/api/auth/get-session')).json()
  expect(session.user.isAnonymous).toBe(true)
  evidence.anonymousSession = true
  const balanceBefore = await (await api.get('/api/credits/balance')).json()
  for (const name of ['survivor', 'partner']) {
    const response = await api.post('/api/upload', { multipart: { provider: 'r2', file: { name: `production-smoke-${name}.png`, mimeType: 'image/png', buffer: png } } })
    expect(response.status()).toBe(200)
    const data = (await response.json()).data
    expect(data.url).toBe(`${mediaOrigin}/${data.key}`)
    expect((await api.get(data.url)).status()).toBe(200)
    evidence.uploads.push({ key: data.key, url: data.url, httpStatus: 200 })
  }
  const invalid = await api.post('/api/video-generate/', { maxRedirects: 0, data: {
    storyTemplate: 'zombie-couple-v1', storyId: 'quiet-embrace', story: 'x'.repeat(501), consent: true,
    survivorImageUrl: evidence.uploads[0].url, partnerImageUrl: evidence.uploads[1].url,
  } })
  expect(invalid.status()).toBe(400)
  expect((await (await api.get('/api/video-generate/')).json()).data.state).toBe('available')
  expect(await (await api.get('/api/credits/balance')).json()).toEqual(balanceBefore)
  evidence.invalidGenerationRejected = true
  evidence.balanceUnchanged = true
  browser = await chromium.launch({ headless: true, proxy })
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
    const context = await browser.newContext({ storageState: await api.storageState(), viewport })
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    for (const path of ['/', '/privacy-policy', '/terms-of-service']) {
      await page.goto(`${origin}${path}`, { waitUntil: 'networkidle' })
      const links = await page.locator('a').evaluateAll(nodes => nodes.map(node => node.getAttribute('href')))
      for (let i = 0; i < links.length; i++) {
        const href = links[i]
        if (href.startsWith('mailto:')) {
          expect(href).toBe('mailto:zw83716@gmail.com')
          continue
        }
        expect(href.startsWith('/') || href.startsWith('#')).toBe(true)
        await page.goto(`${origin}${path}`)
        await page.locator('a').nth(i).click()
        expect(page.url()).toBe(new URL(href, `${origin}${path}`).href)
        await expect(page.locator('h1')).toHaveCount(1)
      }
    }
    await page.goto(origin, { waitUntil: 'networkidle' })
    await expect(page.getByText('Generation may take longer during high demand.', { exact: false })).toHaveCount(0)
    await expect(page.locator('[data-testid="story-options"] button')).toHaveCount(8)
    await expect(page.locator('.home-content > .home-intro')).toHaveCount(0)
    await page.getByLabel('Survivor photo · required', { exact: true }).setInputFiles({ name: 'survivor.png', mimeType: 'image/png', buffer: png })
    await page.getByLabel('Zombie partner photo · required', { exact: true }).setInputFiles({ name: 'partner.png', mimeType: 'image/png', buffer: png })
    await page.getByRole('checkbox').check()
    await expect(page.getByRole('button', { name: 'Generate video', exact: true })).toBeEnabled()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    expect(errors).toEqual([])
    await page.screenshot({ path: `test-results/zombie-production-home-${viewport.width}.png` })
    evidence.browser.push({ viewport, hydrated: true, links: true, generateEnabled: true, overflow: false, pageErrors: errors })
    await context.close()
  }
  console.log(JSON.stringify(evidence))
} finally {
  if (browser) await browser.close()
  await api.dispose()
  await writeFile('test-results/zombie-production-smoke.json', JSON.stringify(evidence, null, 2))
}
