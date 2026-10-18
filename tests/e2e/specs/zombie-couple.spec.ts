import { expect, test, type Page } from '@playwright/test'
import { zombieVideoConfig } from '../../../config/zombieVideo'
import { zombieCoupleEn } from '../../../libs/i18n/locales/zombie-couple/en'

const tinyPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6ru8AAAAASUVORK5CYII=', 'base64')
const photo = (name: string) => ({ name, mimeType: 'image/png', buffer: tinyPng })

async function mockSession(page: Page, result: 'succeeded' | 'failed' = 'succeeded') {
  const submissions: Record<string, unknown>[] = []
  let uploadCount = 0
  await page.route('**/api/auth/get-session', route => route.fulfill({ json: { user: { id: 'test-visitor' } } }))
  await page.route('**/api/upload', route => route.fulfill({ json: { success: true, data: { url: `https://media.example.org/uploads/test-visitor/photo-${++uploadCount}.png` } } }))
  await page.route('**/api/video-generate/', route => {
    if (route.request().method() === 'POST') {
      submissions.push(route.request().postDataJSON())
      return route.fulfill({ json: { success: true, data: { status: 'processing', taskId: 'mock-video-job' } } })
    }
    return route.fulfill({ json: { success: true, data: { state: 'available', taskId: null, storageKey: 'mock-visitor' } } })
  })
  await page.route('**/api/video-generate/status?*', route => route.fulfill({ json: { success: true, data: result === 'failed' ? { status: 'failed' } : { status: 'succeeded', result: { videoUrl: 'https://video.example.org/result.mp4', provider: 'autodl', model: 'minimax-h3' } } } }))
  await page.route('https://video.example.org/result.mp4', route => route.fulfill({ status: 204 }))
  await page.route('**/api/video-generate/download', route => route.fulfill({ body: Buffer.from('mock-video-download'), contentType: 'video/mp4' }))
  return { submissions, uploads: () => uploadCount }
}

test('public page, editable stories and mobile layout', async ({ page }) => {
  await mockSession(page)
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Zombie Couple Video')
  await expect(page.getByRole('link', { name: /sign in|sign up|log in|register/i })).toHaveCount(0)
  await expect(page.locator('video')).toHaveCount(zombieVideoConfig.demo.examples.filter(example => Boolean(example.videoUrl)).length)
  await expect(page.locator('[data-testid="story-options"] button')).toHaveCount(8)
  await expect(page.getByLabel('Your story', { exact: true })).toHaveValue(zombieCoupleEn.stories['quiet-embrace'].prompt)
  for (const id of zombieVideoConfig.storyIds) {
    await page.getByRole('button', { name: zombieCoupleEn.stories[id].name, exact: true }).click()
    await expect(page.getByLabel('Your story', { exact: true })).toHaveValue(zombieCoupleEn.stories[id].prompt)
  }
  await page.getByRole('button', { name: 'Rainy Reunion', exact: true }).click()
  await expect(page.getByLabel('Your story', { exact: true })).toHaveValue(/by the sea/)
  await page.getByLabel('Your story', { exact: true }).fill('We recognize each other and touch foreheads.')
  await expect(page.getByLabel('Your story', { exact: true })).toHaveValue('We recognize each other and touch foreheads.')
  await page.getByRole('button', { name: 'Snowbound Reunion', exact: true }).click()
  await expect(page.getByLabel('Your story', { exact: true })).toHaveValue(/fireplace/)
  await page.getByRole('button', { name: 'Ruins Reunion', exact: true }).click()
  await expect(page.getByLabel('Your story', { exact: true })).toHaveValue(/summer meadow/)
  await page.getByLabel('Your story', { exact: true }).fill('x'.repeat(501))
  await expect(page.getByLabel('Your story', { exact: true })).toHaveValue('x'.repeat(500))
  await expect(page.getByLabel('Your story', { exact: true })).toHaveAttribute('maxlength', '500')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('two uploads, custom story, preview and download without a provider call', async ({ page }) => {
  const mocked = await mockSession(page)
  await page.goto('/')
  const generate = page.getByRole('button', { name: 'Generate video', exact: true })
  await expect(generate).toBeDisabled()
  await page.getByLabel('Survivor photo · required', { exact: true }).setInputFiles(photo('survivor.png'))
  await page.getByRole('checkbox').check()
  await expect(generate).toBeDisabled()
  await page.getByLabel('Zombie partner photo · required', { exact: true }).setInputFiles(photo('partner.png'))
  await page.getByRole('button', { name: 'Rainy Reunion', exact: true }).click()
  await page.getByLabel('Your story', { exact: true }).fill('We recognize each other and touch foreheads in the rain.')
  await page.getByRole('checkbox').check()
  await expect(generate).toBeEnabled()
  await generate.click()
  await expect(page.getByText('Your video is ready.', { exact: true })).toBeVisible()
  expect(mocked.uploads()).toBe(2)
  expect(mocked.submissions).toHaveLength(1)
  expect(mocked.submissions[0]).toMatchObject({ storyTemplate: 'zombie-couple-v1', storyId: 'rainy-reunion', story: 'We recognize each other and touch foreheads in the rain.', consent: true })
  expect(mocked.submissions[0].survivorImageUrl).not.toBe(mocked.submissions[0].partnerImageUrl)
  await expect(page.getByRole('button', { name: 'Rainy Reunion', exact: true })).toBeDisabled()
  const downloadEvent = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download video', exact: true }).click()
  expect((await downloadEvent).suggestedFilename()).toBe('zombie-couple-video.mp4')
})

test('confirmed provider failure restores the editable form', async ({ page }) => {
  const mocked = await mockSession(page, 'failed')
  await page.goto('/')
  await page.getByLabel('Survivor photo · required', { exact: true }).setInputFiles(photo('survivor.png'))
  await page.getByLabel('Zombie partner photo · required', { exact: true }).setInputFiles(photo('partner.png'))
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Generate video', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('could not be generated')
  await expect(page.getByRole('button', { name: 'Generate video', exact: true })).toBeEnabled()
  await expect(page.getByLabel('Your story', { exact: true })).toBeEnabled()
  expect(mocked.submissions).toHaveLength(1)
})

for (const outcome of ['succeeded', 'failed'] as const) {
  test(`slow-generation note waits two minutes, appears below preview and clears when ${outcome}`, async ({ page }) => {
    await mockSession(page)
    let state: 'processing' | 'succeeded' | 'failed' = 'processing'
    let releaseUploads!: () => void
    const uploadGate = new Promise<void>(resolve => { releaseUploads = resolve })
    let uploadCount = 0
    await page.route('**/api/upload', async route => {
      await uploadGate
      await route.fulfill({ json: { success: true, data: { url: `https://media.example.org/uploads/test-visitor/slow-${++uploadCount}.png` } } })
    })
    await page.route('**/api/video-generate/status?*', route => route.fulfill({ json: { success: true, data: state === 'succeeded'
      ? { status: state, result: { videoUrl: 'https://video.example.org/result.mp4', provider: 'autodl', model: 'minimax-h3' } }
      : { status: state } } }))
    await page.clock.install({ time: new Date('2026-10-15T08:00:00Z') })
    await page.goto('/')
    const note = page.getByText(zombieCoupleEn.tool.progressHint, { exact: true })
    await expect(note).toHaveCount(0)
    await page.getByLabel('Survivor photo · required', { exact: true }).setInputFiles(photo('survivor.png'))
    await page.getByLabel('Zombie partner photo · required', { exact: true }).setInputFiles(photo('partner.png'))
    await page.getByRole('checkbox').check()
    await page.clock.pauseAt(new Date('2026-10-15T08:01:00Z'))
    const firstUpload = page.waitForRequest('**/api/upload')
    await page.getByRole('button', { name: 'Generate video', exact: true }).click()
    await firstUpload
    await page.clock.fastForward(60_000)
    await expect(note).toHaveCount(0)
    const processing = page.waitForResponse('**/api/video-generate/status?*')
    releaseUploads()
    await processing
    await page.clock.fastForward(59_999)
    await expect(note).toHaveCount(0)
    await page.clock.fastForward(1)
    await expect(note).toBeVisible()
    const resultPanel = page.getByTestId('generation-result')
    await expect(resultPanel.getByText(zombieCoupleEn.tool.progressHint, { exact: true })).toBeVisible()
    await expect(page.locator('form').getByText(zombieCoupleEn.tool.progressHint, { exact: true })).toHaveCount(0)
    const preview = await resultPanel.locator('[aria-busy]').boundingBox()
    const noteBox = await note.boundingBox()
    expect(noteBox!.y).toBeGreaterThanOrEqual(preview!.y + preview!.height)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    state = outcome
    await page.clock.fastForward(10_000)
    if (outcome === 'succeeded') await expect(page.getByText('Your video is ready.', { exact: true })).toBeVisible()
    else await expect(page.getByRole('alert')).toContainText('could not be generated')
    await expect(note).toHaveCount(0)
    await page.clock.fastForward(120_000)
    await expect(note).toHaveCount(0)
    if (outcome === 'failed') {
      state = 'processing'
      const retried = page.waitForResponse('**/api/video-generate/status?*')
      await page.getByRole('button', { name: 'Generate video', exact: true }).click()
      await retried
      await page.clock.fastForward(119_999)
      await expect(note).toHaveCount(0)
    }
  })
}

test('SSR and public route metadata match the current product', async ({ request }) => {
  for (const path of ['/', '/privacy-policy', '/terms-of-service']) {
    const response = await request.get(path)
    expect(response.status()).toBe(200)
    const html = await response.text()
    expect(html).toContain('Zombie Couple Video')
    expect(html).not.toContain('Rumpelstiltskin')
    expect(html).toContain(`href="https://zombie-couple-video.net${path === '/' ? '/' : path}"`)
    expect(html).toContain(path === '/' ? 'index, follow' : 'noindex, follow')
  }
  for (const [path, target] of [['/zombie-couple-video-generator', '/'], ['/how-to-make-zombie-couple-video', '/#how-to-make']]) {
    const response = await request.get(path, { maxRedirects: 0 })
    expect(response.status()).toBe(301)
    expect(new URL(response.headers().location, response.url()).pathname + new URL(response.headers().location, response.url()).hash).toBe(target)
  }
  const sitemap = await (await request.get('/sitemap.xml')).text()
  expect([...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1])).toEqual(['https://zombie-couple-video.net/'])
  expect(await (await request.get('/robots.txt')).text()).toContain('Sitemap: https://zombie-couple-video.net/sitemap.xml')
})

test('homepage SEO content is available without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  try {
    const page = await context.newPage()
    await page.goto('http://127.0.0.1:7001/')
    const keyword = 'zombie couple video'
    const title = await page.title()
    expect(title.length).toBeGreaterThanOrEqual(50)
    expect(title.length).toBeLessThanOrEqual(60)
    expect(title.toLowerCase()).toContain(keyword)
    const description = (await page.locator('meta[name="description"]').getAttribute('content'))!
    expect(description.length).toBeGreaterThanOrEqual(150)
    expect(description.length).toBeLessThanOrEqual(160)
    expect(description).toContain(keyword)
    await expect(page.locator('h1')).toHaveCount(1)
    await expect(page.locator('h1')).toHaveText('Zombie Couple Video')
    await expect(page.locator('noscript p')).toHaveText('Enable JavaScript to upload photos and generate your video. You can still read the instructions and policies below.')
    await expect(page.locator('noscript p')).toBeVisible()
    await expect(page.locator('#how-to-make')).toBeVisible()
    await expect(page.locator('#stories')).toHaveCount(0)
    await expect(page.locator('#photo-and-story-tips')).toBeVisible()
    expect(JSON.parse(await page.locator('script[type="application/ld+json"]').innerText())).toMatchObject({ '@type': 'WebApplication', url: 'https://zombie-couple-video.net/' })
    await expect(page.locator('a[href="/zombie-couple-video-generator"], a[href="/how-to-make-zombie-couple-video"]')).toHaveCount(0)
  } finally { await context.close() }
})

test('visitors can follow every public link and return home', async ({ page }) => {
  for (const path of ['/', '/privacy-policy', '/terms-of-service']) {
    await page.goto(path)
    const links = await page.locator('a').evaluateAll(elements => elements.map(a => ({ href: a.getAttribute('href')!, text: a.textContent })))
    for (let index = 0; index < links.length; index++) {
      await page.goto(path)
      const link = page.locator('a').nth(index)
      const { href } = links[index]
      if (href.startsWith('mailto:')) {
        expect(href).toBe('mailto:zw83716@gmail.com')
        await link.evaluate(a => a.addEventListener('click', event => event.preventDefault(), { once: true }))
        await link.click() // Exercise the link without opening a mail client or sending.
      } else if (href.startsWith('https://')) {
        expect(href).toBe('https://zombiecouplevideo.com/#templates')
        await expect(link).toHaveAttribute('target', '_blank')
        await expect(link).toHaveAttribute('rel', /noopener/)
        await link.evaluate(a => a.addEventListener('click', event => event.preventDefault(), { once: true }))
        await link.click()
      } else {
        await link.click()
        await expect(page).toHaveURL(`http://127.0.0.1:7001${href}`)
        await expect(page.locator('h1')).toHaveCount(1)
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      }
    }
  }
  const response = await page.goto('/visitor-test-missing-page')
  expect(response?.status()).toBe(404)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Page not found')
  await page.locator('main a[href="/"]').click()
  await expect(page).toHaveURL('http://127.0.0.1:7001/')
})

test('reference demos load on demand and support playback and seeking', async ({ page }) => {
  const mediaRequests: string[] = []
  page.on('request', request => { if (/\/videos\/.*\.mp4/.test(request.url())) mediaRequests.push(request.url()) })
  await mockSession(page)
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Zombie Couple Video Examples', exact: true })).toBeVisible()
  await expect(page.getByText(/These are third-party examples/)).toHaveCount(0)
  await expect(page.locator('a[href="https://zombiecouplevideo.com/#templates"]')).toHaveCount(0)
  expect(mediaRequests).toHaveLength(0)
  for (const example of zombieVideoConfig.demo.examples) {
    const video = page.getByTestId(example.id)
    await expect(video).toHaveAttribute('preload', 'none')
    await expect(video).toHaveAttribute('controls', '')
    await expect(video).toHaveAttribute('playsinline', '')
    expect(await video.getAttribute('autoplay')).toBeNull()
    const poster = await page.request.get(example.posterUrl)
    expect(poster.status()).toBe(200)
    expect(poster.headers()['content-type']).toContain('image/jpeg')
    await video.scrollIntoViewIfNeeded()
    await video.evaluate(async element => { const v = element as HTMLVideoElement; v.muted = true; await v.play() })
    await expect.poll(() => video.evaluate(element => (element as HTMLVideoElement).currentTime)).toBeGreaterThan(0.1)
    const info = await video.evaluate(element => { const v = element as HTMLVideoElement; v.pause(); v.currentTime = v.duration / 2; return { duration: v.duration, width: v.videoWidth, height: v.videoHeight, error: v.error?.message } })
    expect(info.duration).toBeGreaterThan(11)
    expect(info.duration).toBeLessThan(13)
    expect(info.height).toBeGreaterThan(info.width)
    expect(info.error).toBeUndefined()
    await expect.poll(() => video.evaluate(element => (element as HTMLVideoElement).seeking)).toBe(false)
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('photo validation, change and remove keep generation safe', async ({ page }) => {
  const mocked = await mockSession(page)
  await page.goto('/')
  const survivor = page.getByLabel('Survivor photo · required', { exact: true })
  await survivor.setInputFiles({ name: 'portrait.gif', mimeType: 'image/gif', buffer: tinyPng })
  await expect(page.getByRole('alert')).toContainText('valid JPG, PNG, or WebP')
  await survivor.setInputFiles({ name: 'too-large.png', mimeType: 'image/png', buffer: Buffer.alloc(10 * 1024 * 1024 + 1) })
  await expect(page.getByRole('alert')).toContainText('smaller than 10 MB')
  await survivor.setInputFiles({ name: 'corrupt.png', mimeType: 'image/png', buffer: Buffer.from('not an image') })
  await expect(page.getByRole('alert')).toContainText('opens correctly')
  await expect(page.locator('img')).toHaveCount(0)
  await survivor.setInputFiles(photo('survivor.png'))
  await expect(page.getByRole('button', { name: 'Change photo', exact: true })).toBeEnabled()
  await survivor.setInputFiles(photo('survivor-replacement.png'))
  await expect(page.getByText('survivor-replacement.png', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Remove photo', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Choose survivor photo', exact: true })).toBeVisible()
  await page.getByLabel('Zombie partner photo · required', { exact: true }).setInputFiles(photo('partner.png'))
  await expect(page.getByRole('button', { name: 'Remove partner photo', exact: true })).toBeEnabled()
  await page.getByRole('button', { name: 'Remove partner photo', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Choose partner photo', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Generate video', exact: true })).toBeDisabled()
  expect(mocked.uploads()).toBe(0)
  expect(mocked.submissions).toHaveLength(0)
})

test('upload and download errors have working retries', async ({ page }) => {
  const mocked = await mockSession(page)
  let uploads = 0
  let downloads = 0
  await page.route('**/api/upload', route => ++uploads === 1 ? route.fulfill({ status: 500, json: { error: 'unavailable' } }) : route.fulfill({ json: { success: true, data: { url: `https://media.example.org/uploads/test-visitor/retry-${uploads}.png` } } }))
  await page.route('**/api/video-generate/download', route => ++downloads === 1 ? route.fulfill({ status: 502 }) : route.fulfill({ body: Buffer.from('mock-video'), contentType: 'video/mp4' }))
  await page.goto('/')
  await page.getByLabel('Survivor photo · required', { exact: true }).setInputFiles(photo('survivor.png'))
  await expect(page.getByRole('button', { name: 'Change photo', exact: true })).toBeEnabled()
  await page.getByLabel('Zombie partner photo · required', { exact: true }).setInputFiles(photo('partner.png'))
  await page.getByRole('checkbox').check()
  const generate = page.getByRole('button', { name: 'Generate video', exact: true })
  await generate.click()
  await expect(page.getByRole('alert')).toContainText('could not be uploaded')
  expect(mocked.submissions).toHaveLength(0)
  await expect(generate).toBeEnabled()
  await generate.click()
  await expect(page.getByText('Your video is ready.', { exact: true })).toBeVisible()
  const download = page.getByRole('button', { name: 'Download video', exact: true })
  await download.click()
  await expect(page.getByRole('alert')).toContainText('could not be downloaded')
  await expect(download).toBeEnabled()
  const event = page.waitForEvent('download')
  await download.click()
  expect((await event).suggestedFilename()).toBe('zombie-couple-video.mp4')
  expect(mocked.submissions).toHaveLength(1)
})

test('used trial explains the limit without promising a new generation', async ({ page }) => {
  const mocked = await mockSession(page)
  await page.route('**/api/video-generate/', route => route.fulfill({ json: { success: true, data: { state: 'used', taskId: null, storageKey: 'mock-visitor' } } }))
  await page.goto('/')
  await expect(page.getByText(/Your free video has been used/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Generate video', exact: true })).toBeDisabled()
  await expect(page.getByText(zombieCoupleEn.tool.costHint, { exact: true })).toBeVisible()
  await expect(page.locator('form a[href="/terms-of-service"]')).toBeVisible()
  await expect(page.locator('form a[href="/privacy-policy"]')).toBeVisible()
  expect(mocked.submissions).toHaveLength(0)
})

test('interrupted task checks retry without uploading or starting another video', async ({ page }) => {
  const mocked = await mockSession(page)
  await page.route('**/api/video-generate/', route => route.fulfill({ json: { success: true, data: { state: 'processing', taskId: 'existing-task', storageKey: 'mock-visitor' } } }))
  let checks = 0
  await page.route('**/api/video-generate/status?*', route => ++checks === 1 ? route.fulfill({ status: 503 }) : route.fulfill({ json: { success: true, data: { status: 'succeeded', result: { videoUrl: 'https://video.example.org/result.mp4', provider: 'autodl', model: 'minimax-h3' } } } }))
  await page.goto('/')
  await expect(page.getByRole('alert')).toContainText('could not be retrieved')
  await page.getByRole('button', { name: 'Try again', exact: true }).click()
  await expect(page.getByText('Your video is ready.', { exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByText('Your video is ready.', { exact: true })).toBeVisible()
  expect(checks).toBe(3)
  expect(mocked.uploads()).toBe(0)
  expect(mocked.submissions).toHaveLength(0)
})

test('a lost submission response recovers the created task instead of locking the form', async ({ page }) => {
  const mocked = await mockSession(page)
  let submissions = 0
  await page.route('**/api/video-generate/', route => {
    if (route.request().method() === 'POST') {
      submissions++
      return route.abort('connectionreset')
    }
    return route.fulfill({ json: { success: true, data: { state: submissions ? 'processing' : 'available', taskId: submissions ? 'created-before-response-lost' : null, storageKey: 'mock-visitor' } } })
  })
  await page.goto('/')
  await page.getByLabel('Survivor photo · required', { exact: true }).setInputFiles(photo('survivor.png'))
  await expect(page.getByRole('button', { name: 'Change photo', exact: true })).toBeEnabled()
  await page.getByLabel('Zombie partner photo · required', { exact: true }).setInputFiles(photo('partner.png'))
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Generate video', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('could not be retrieved')
  await page.getByRole('button', { name: 'Try again', exact: true }).click()
  await expect(page.getByText('Your video is ready.', { exact: true })).toBeVisible()
  expect(submissions).toBe(1)
  expect(mocked.uploads()).toBe(2)
})
