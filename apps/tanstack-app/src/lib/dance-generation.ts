import { aiVideoConfig } from '../../../../config/aiVideo'
import { creditsConfig, resolveFixedConsumption } from '../../../../config/credits'
import type { VideoGenerationResult, VideoProviderName } from '@libs/ai/types'
import { zombieVideoConfig, type ZombieStoryId } from '../../../../config/zombieVideo'
export type DanceErrorCode = 'fileType' | 'fileSize' | 'photoRequired' | 'partnerRequired' | 'storyLength' | 'consentRequired' | 'upload' | 'generation' | 'credits' | 'status' | 'timeout' | 'download' | 'invalidResponse' | 'unauthorized' | 'expired' | 'trialUsed' | 'trialProcessing' | 'rateLimited' | 'visitor'
export type DancePhase = 'idle' | 'uploading' | 'submitting' | 'processing' | 'succeeded' | 'failed'

export class DanceGenerationError extends Error {
  constructor(readonly code: DanceErrorCode) {
    super(code)
    this.name = 'DanceGenerationError'
  }
}

export const DANCE_PHOTO_ACCEPT = '.jpg,.jpeg,.png,.webp'
const MAX_PHOTO_BYTES = 10 * 1024 * 1024
const provider = aiVideoConfig.defaultProvider as VideoProviderName
const model = aiVideoConfig.defaultModels[provider]
export const DANCE_CREDIT_COST = resolveFixedConsumption(creditsConfig.fixedConsumption.aiVideo, model)
export const DANCE_DURATION_SECONDS = aiVideoConfig.defaults.duration

export function validateDancePhoto(file: File): 'fileType' | 'fileSize' | null {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || !/\.(jpe?g|png|webp)$/i.test(file.name) || file.size === 0) return 'fileType'
  return file.size > MAX_PHOTO_BYTES ? 'fileSize' : null
}

/** MIME and extension alone do not prove a file can be displayed as an image. */
export async function canDecodePhoto(file: File): Promise<boolean> {
  const url = URL.createObjectURL(file)
  try {
    return await new Promise<boolean>(resolve => {
      const image = new Image()
      image.onload = () => resolve(image.naturalWidth > 0 && image.naturalHeight > 0)
      image.onerror = () => resolve(false)
      image.src = url
    })
  } finally { URL.revokeObjectURL(url) }
}

export function buildDanceRequest(dancerImageUrl: string, princessImageUrl: string, storyId: ZombieStoryId, story: string) {
  if (!isHttpUrl(dancerImageUrl) || !isHttpUrl(princessImageUrl)) {
    throw new DanceGenerationError('invalidResponse')
  }
  return {
    storyTemplate: zombieVideoConfig.template,
    survivorImageUrl: dancerImageUrl,
    partnerImageUrl: princessImageUrl,
    storyId, story, consent: true,
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function isHttpUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch { return false }
}

function readVideoResult(value: unknown): VideoGenerationResult {
  if (!isRecord(value) || typeof value.videoUrl !== 'string'
    || !(isHttpUrl(value.videoUrl) || /^data:video\/[a-z0-9.+-]+;base64,[a-z0-9+/=\s]+$/i.test(value.videoUrl))
    || !['fal', 'volcengine', 'aliyun', provider].includes(String(value.provider)) || typeof value.model !== 'string') {
    throw new DanceGenerationError('invalidResponse')
  }
  return {
    videoUrl: value.videoUrl,
    provider: value.provider as VideoProviderName,
    model: value.model,
    ...(typeof value.duration === 'number' ? { duration: value.duration } : {}),
    ...(isHttpUrl(value.coverImageUrl) ? { coverImageUrl: value.coverImageUrl } : {}),
  }
}

async function readApiData(response: Response, fallback: DanceErrorCode): Promise<Record<string, unknown>> {
  if (response.status === 401) throw new DanceGenerationError('unauthorized')
  if (response.status === 402) throw new DanceGenerationError('credits')
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { error?: string } | null
    const code: DanceErrorCode = payload?.error === 'trial_used' ? 'trialUsed' : payload?.error === 'trial_processing' ? 'trialProcessing' : response.status === 429 ? 'rateLimited' : payload?.error === 'visitor_required' ? 'visitor' : fallback
    throw new DanceGenerationError(code)
  }
  let payload: unknown
  try { payload = await response.json() } catch { throw new DanceGenerationError('invalidResponse') }
  if (!isRecord(payload) || payload.success !== true || !isRecord(payload.data)) throw new DanceGenerationError('invalidResponse')
  return payload.data
}

export interface DanceTrial { state: 'available' | 'processing' | 'used'; taskId: string | null; storageKey: string }
export async function readDanceTrial(signal?: AbortSignal): Promise<DanceTrial> {
  const data = await readApiData(await fetch('/api/video-generate/', { signal, cache: 'no-store' }), 'visitor')
  if (!['available', 'processing', 'used'].includes(String(data.state)) || typeof data.storageKey !== 'string') throw new DanceGenerationError('invalidResponse')
  return { state: data.state as DanceTrial['state'], taskId: typeof data.taskId === 'string' ? data.taskId : null, storageKey: data.storageKey }
}

export async function ensureDanceSession(signal: AbortSignal) {
  const sessionResponse = await fetch('/api/auth/get-session', { signal, cache: 'no-store' })
  if (!sessionResponse.ok) throw new DanceGenerationError('visitor')
  const session = await sessionResponse.json() as { user?: { id?: string } } | null
  if (session?.user?.id) return
  // Better Auth's installed anonymous plugin issues the protected session cookie.
  const response = await fetch('/api/auth/sign-in/anonymous', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}', signal })
  if (!response.ok) {
    const error = await response.json().catch(() => null) as { error?: string } | null
    throw new DanceGenerationError(error?.error === 'trial_used' ? 'trialUsed' : error?.error === 'trial_processing' ? 'trialProcessing' : response.status === 429 ? 'rateLimited' : 'visitor')
  }
}

export async function uploadDancePhoto(file: File, signal: AbortSignal, transport: typeof fetch = fetch): Promise<string> {
  const validationError = validateDancePhoto(file)
  if (validationError) throw new DanceGenerationError(validationError)
  const form = new FormData()
  form.append('file', file)
  form.append('provider', 'r2')
  const response = await transport('/api/upload', { method: 'POST', body: form, signal })
  const data = await readApiData(response, 'upload')
  if (!isHttpUrl(data.url)) throw new DanceGenerationError('invalidResponse')
  return data.url
}

export type DanceSubmission = { status: 'processing'; taskId: string } | { status: 'succeeded'; result: VideoGenerationResult }

export async function startDanceGeneration(dancerImageUrl: string, princessImageUrl: string, storyId: ZombieStoryId, story: string, signal: AbortSignal, transport: typeof fetch = fetch): Promise<DanceSubmission> {
  const response = await transport('/api/video-generate/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(buildDanceRequest(dancerImageUrl, princessImageUrl, storyId, story)),
    signal,
  })
  const data = await readApiData(response, 'generation')
  if (data.status === 'processing' && typeof data.taskId === 'string' && data.taskId.trim()) return { status: 'processing', taskId: data.taskId }
  return { status: 'succeeded', result: readVideoResult(data) }
}

function delay(ms: number, signal: AbortSignal): Promise<void> {
  signal.throwIfAborted()
  return new Promise((resolve, reject) => {
    const onAbort = () => { clearTimeout(timer); reject(signal.reason ?? new DOMException('Aborted', 'AbortError')) }
    const timer = setTimeout(() => { signal.removeEventListener('abort', onAbort); resolve() }, ms)
    signal.addEventListener('abort', onAbort, { once: true })
  })
}

export async function pollDanceTask(taskId: string, signal: AbortSignal, transport: typeof fetch = fetch, polling: { intervalMs: number; maxTimeoutMs: number } = aiVideoConfig.polling): Promise<VideoGenerationResult> {
  signal.throwIfAborted()
  const startedAt = Date.now()
  const pollingController = new AbortController()
  const onAbort = () => pollingController.abort(signal.reason)
  signal.addEventListener('abort', onAbort, { once: true })
  const timeout = setTimeout(() => pollingController.abort(new DanceGenerationError('timeout')), polling.maxTimeoutMs)
  try {
    while (Date.now() - startedAt < polling.maxTimeoutMs) {
      pollingController.signal.throwIfAborted()
      const response = await transport(`/api/video-generate/status?taskId=${encodeURIComponent(taskId)}`, { signal: pollingController.signal, cache: 'no-store' })
      if (response.status === 404) throw new DanceGenerationError('expired')
      const data = await readApiData(response, 'status')
      if (data.status === 'succeeded') return readVideoResult(data.result)
      if (data.status === 'failed') throw new DanceGenerationError('generation')
      if (data.status !== 'processing') throw new DanceGenerationError('invalidResponse')
      await delay(Math.min(polling.intervalMs, Math.max(0, polling.maxTimeoutMs - (Date.now() - startedAt))), pollingController.signal)
    }
    throw new DanceGenerationError('timeout')
  } catch (cause) {
    if (signal.aborted) throw signal.reason
    if (pollingController.signal.aborted && pollingController.signal.reason instanceof DanceGenerationError) throw pollingController.signal.reason
    throw cause
  } finally {
    clearTimeout(timeout)
    signal.removeEventListener('abort', onAbort)
  }
}
