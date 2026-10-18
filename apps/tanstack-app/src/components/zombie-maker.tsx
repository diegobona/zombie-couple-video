import { useEffect, useId, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { CheckCircle2, Download, Film, ImagePlus, LoaderCircle, RotateCcw, Upload } from 'lucide-react'
import { Button } from '@libs/react-shared/ui/button'
import { zombieVideoConfig, type ZombieStoryId } from '../../../../config/zombieVideo'
import { zombieCoupleEn } from '@libs/i18n/locales/zombie-couple/en'
import type { VideoGenerationResult } from '@libs/ai/types'
import { forgetDanceTask, readDanceTask, rememberDanceTask } from '../lib/dance-task-session'
import {
  DANCE_CREDIT_COST,
  DANCE_DURATION_SECONDS,
  DANCE_PHOTO_ACCEPT,
  DanceGenerationError,
  ensureDanceSession,
  readDanceTrial,
  pollDanceTask,
  startDanceGeneration,
  uploadDancePhoto,
  validateDancePhoto,
  canDecodePhoto,
  type DanceErrorCode,
  type DancePhase,
} from '../lib/dance-generation'

export interface ZombieMakerCopy {
  photoPrivacyHint: string
  photoPrivacyLinkLabel: string
  legalLead: string
  legalJoin: string
  termsLabel: string
  privacyLabel: string
  noJavaScriptHint: string
  storyLabel: string
  storyHint: string
  customStoryLabel: string
  customStoryHint: string
  storyCounter: string
  photoLabel: string
  photoHint: string
  choosePhoto: string
  changePhoto: string
  removePhoto: string
  photoPreviewAlt: string
  princessLabel: string
  princessHint: string
  choosePrincess: string
  changePrincess: string
  restorePrincess: string
  princessPreviewAlt: string
  defaultPrincessAlt: string
  defaultPrincessLabel: string
  generateButton: string
  retryGenerate: string
  retryStatus: string
  resetButton: string
  consentLabel: string
  costHint: string
  offerNoLogin: string
  offerFree: string
  trialHint: string
  trialUsedHint: string
  trialPendingHint: string
  resultTitle: string
  resultEmpty: string
  videoLabel: string
  videoUnsupported: string
  status: Record<DancePhase, string>
  progressHint: string
  fidelityHint: string
  unavailableHint: string
  downloadButton: string
  downloading: string
  downloadHint: string
  errors: Record<DanceErrorCode, string>
}

interface ZombieMakerProps {
  copy: ZombieMakerCopy
  isAvailable?: boolean
  className?: string
}

const SLOW_GENERATION_HINT_DELAY_MS = 2 * 60 * 1000

export function ZombieMaker({ copy, isAvailable = true, className = '' }: ZombieMakerProps) {
  const id = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const princessInputRef = useRef<HTMLInputElement>(null)
  const operationRef = useRef<AbortController | null>(null)
  const downloadRef = useRef<AbortController | null>(null)
  const runRef = useRef(0)
  const [photo, setPhoto] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)
  const [princessPhoto, setPrincessPhoto] = useState<File | null>(null)
  const [princessPreviewUrl, setPrincessPreviewUrl] = useState<string | null>(null)
  const [uploadedPrincessUrl, setUploadedPrincessUrl] = useState<string | null>(null)
  const [storyId, setStoryId] = useState<ZombieStoryId>(zombieVideoConfig.defaultStoryId)
  const [story, setStory] = useState<string>(zombieCoupleEn.stories[zombieVideoConfig.defaultStoryId].prompt)
  const [consent, setConsent] = useState(false)
  const [phase, setPhase] = useState<DancePhase>('idle')
  const [error, setError] = useState<DanceErrorCode | null>(null)
  const [taskId, setTaskId] = useState<string | null>(null)
  const [result, setResult] = useState<VideoGenerationResult | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [trialState, setTrialState] = useState<'available' | 'processing' | 'used'>('available')
  const [trialLoading, setTrialLoading] = useState(true)
  const [storageKey, setStorageKey] = useState<string | null>(null)
  const [checkingPhoto, setCheckingPhoto] = useState(false)
  const [checkingPrincess, setCheckingPrincess] = useState(false)
  const [showSlowGenerationHint, setShowSlowGenerationHint] = useState(false)
  const isWorking = phase === 'uploading' || phase === 'submitting' || phase === 'processing'
  const canCheckTask = Boolean(taskId && phase === 'failed')
  const referencesLocked = isWorking || canCheckTask || trialState !== 'available' || checkingPhoto || checkingPrincess
  const costHint = copy.costHint.replace('{credits}', String(DANCE_CREDIT_COST)).replace('{duration}', String(DANCE_DURATION_SECONDS))

  useEffect(() => {
    setShowSlowGenerationHint(false)
    if (!isWorking) return
    const timer = window.setTimeout(() => setShowSlowGenerationHint(true), SLOW_GENERATION_HINT_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [isWorking])

  useEffect(() => {
    if (!photo) { setPreviewUrl(null); return }
    const url = URL.createObjectURL(photo)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [photo])

  useEffect(() => {
    if (!princessPhoto) { setPrincessPreviewUrl(null); return }
    const url = URL.createObjectURL(princessPhoto)
    setPrincessPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [princessPhoto])

  useEffect(() => () => {
    runRef.current += 1
    operationRef.current?.abort()
    downloadRef.current?.abort()
  }, [])

  useEffect(() => {
    let disposed = false
    void readDanceTrial().then(async trial => {
      if (disposed) return
      setTrialState(trial.state)
      setStorageKey(trial.storageKey)
      setTrialLoading(false)
      // Establishing a guest session during submission must not clear photos or
      // abort that submission. Only an idle maker resumes a previous task.
      if (operationRef.current) return
      let savedTask = trial.taskId
      if (!savedTask) {
        try { savedTask = readDanceTask(window.sessionStorage, trial.storageKey) } catch { /* Storage may be disabled. */ }
      }
      if (!savedTask) return
      const run = ++runRef.current
      const controller = new AbortController()
      operationRef.current = controller
      setTaskId(savedTask)
      setPhase('processing')
      try {
        const video = await pollDanceTask(savedTask, controller.signal)
        if (controller.signal.aborted || run !== runRef.current) return
        setResult(video)
        setPhase('succeeded')
        setTrialState('used')
      } catch (cause) {
        if (controller.signal.aborted || run !== runRef.current) return
        const code = cause instanceof DanceGenerationError ? cause.code : 'status'
        if (code === 'expired' || code === 'generation') {
          try { forgetDanceTask(window.sessionStorage, trial.storageKey) } catch { /* Storage may be disabled. */ }
          setTaskId(null)
          const refreshed = await readDanceTrial().catch(() => null)
          if (refreshed) setTrialState(refreshed.state)
        }
        setError(code)
        setPhase('failed')
      } finally {
        if (operationRef.current === controller) operationRef.current = null
        window.dispatchEvent(new Event('credits-updated'))
      }
    }).catch(() => { if (!disposed) { setTrialLoading(false); setError('visitor') } })
    return () => { disposed = true }
  }, [])

  const clearResult = () => {
    if (storageKey) {
      try { forgetDanceTask(window.sessionStorage, storageKey) } catch { /* Storage may be disabled. */ }
    }
    runRef.current += 1
    operationRef.current?.abort()
    downloadRef.current?.abort()
    operationRef.current = null
    downloadRef.current = null
    setTaskId(null)
    setResult(null)
    setPhase('idle')
    setError(null)
    setDownloading(false)
  }

  const reset = () => {
    clearResult()
    setPhoto(null)
    setUploadedUrl(null)
    setPrincessPhoto(null)
    setUploadedPrincessUrl(null)
    setConsent(false)
    if (inputRef.current) inputRef.current.value = ''
    if (princessInputRef.current) princessInputRef.current.value = ''
  }

  const choosePhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ''
    if (!file) return
    const validationError = validateDancePhoto(file)
    if (validationError) { setError(validationError); return }
    setCheckingPhoto(true)
    try {
      if (!await canDecodePhoto(file)) { setError('fileType'); return }
      clearResult()
      setPhoto(file)
      setUploadedUrl(null)
      setConsent(false)
    } finally { setCheckingPhoto(false) }
  }

  const choosePrincess = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ''
    if (!file) return
    const validationError = validateDancePhoto(file)
    if (validationError) { setError(validationError); return }
    setCheckingPrincess(true)
    try {
      if (!await canDecodePhoto(file)) { setError('fileType'); return }
      clearResult()
      setPrincessPhoto(file)
      setUploadedPrincessUrl(null)
      setConsent(false)
    } finally { setCheckingPrincess(false) }
  }

  const removeDancer = () => {
    clearResult()
    setPhoto(null)
    setUploadedUrl(null)
    setConsent(false)
  }

  const restorePrincess = () => {
    clearResult()
    setPrincessPhoto(null)
    setUploadedPrincessUrl(null)
    setConsent(false)
  }

  const generate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isWorking || checkingPhoto || checkingPrincess || operationRef.current || (!isAvailable && !canCheckTask)) return
    if (!canCheckTask && trialState !== 'available') { setError(trialState === 'used' ? 'trialUsed' : 'trialProcessing'); return }
    if (!canCheckTask) {
      if (!photo) { setError('photoRequired'); return }
      if (!princessPhoto) { setError('partnerRequired'); return }
      if (story.length > zombieVideoConfig.maxStoryLength) { setError('storyLength'); return }
      const validationError = validateDancePhoto(photo) || (princessPhoto ? validateDancePhoto(princessPhoto) : null)
      if (validationError) { setError(validationError); return }
      if (!consent) { setError('consentRequired'); return }
    }

    const controller = new AbortController()
    operationRef.current = controller
    const run = ++runRef.current
    let currentPhase: DancePhase = canCheckTask ? 'processing' : 'uploading'
    setError(null)
    setResult(null)
    setPhase(currentPhase)
    try {
      let video: VideoGenerationResult
      if (canCheckTask && taskId) {
        // A status retry keeps the existing task and never repeats the paid POST.
        video = await pollDanceTask(taskId, controller.signal)
      } else {
        const trial = await readDanceTrial(controller.signal)
        setStorageKey(trial.storageKey)
        if (trial.state !== 'available') throw new DanceGenerationError(trial.state === 'used' ? 'trialUsed' : 'trialProcessing')
        await ensureDanceSession(controller.signal)
        const url = uploadedUrl || await uploadDancePhoto(photo!, controller.signal)
        if (run !== runRef.current) return
        setUploadedUrl(url)
        const princessUrl = princessPhoto
          ? uploadedPrincessUrl || await uploadDancePhoto(princessPhoto, controller.signal)
          : undefined
        if (run !== runRef.current) return
        setUploadedPrincessUrl(princessUrl ?? null)
        currentPhase = 'submitting'
        setPhase(currentPhase)
        const submission = await startDanceGeneration(url, princessUrl!, storyId, story, controller.signal)
        window.dispatchEvent(new Event('credits-updated'))
        if (run !== runRef.current) return
        if (submission.status === 'processing') {
          setTaskId(submission.taskId)
          setTrialState('processing')
          try { rememberDanceTask(window.sessionStorage, trial.storageKey, submission.taskId) } catch { /* Storage may be disabled. */ }
          currentPhase = 'processing'
          setPhase(currentPhase)
          video = await pollDanceTask(submission.taskId, controller.signal)
        } else {
          video = submission.result
        }
      }
      if (run !== runRef.current) return
      setResult(video)
      setPhase('succeeded')
      setTrialState('used')
      window.dispatchEvent(new Event('credits-updated'))
    } catch (cause) {
      if (controller.signal.aborted || run !== runRef.current) return
      let code = cause instanceof DanceGenerationError ? cause.code
        : currentPhase === 'uploading' ? 'upload'
          : currentPhase === 'processing' ? 'status' : 'generation'
      // A confirmed provider failure is terminal; checking a live task can be retried.
      if (currentPhase === 'processing' && (code === 'generation' || code === 'expired')) {
        setTaskId(null)
        if (storageKey) { try { forgetDanceTask(window.sessionStorage, storageKey) } catch { /* Storage may be disabled. */ } }
      }
      const refreshed = await readDanceTrial().catch(() => null)
      if (refreshed) {
        setTrialState(refreshed.state)
        // A lost POST response may hide a successfully created task. Recover its
        // server-owned ID so Try again checks status instead of starting a job.
        if (refreshed.state !== 'available' && refreshed.taskId) {
          setTaskId(refreshed.taskId)
          setStorageKey(refreshed.storageKey)
          try { rememberDanceTask(window.sessionStorage, refreshed.storageKey, refreshed.taskId) } catch { /* Storage may be disabled. */ }
          code = 'status'
        }
      }
      setError(code)
      setPhase('failed')
      window.dispatchEvent(new Event('credits-updated'))
    } finally {
      if (operationRef.current === controller) operationRef.current = null
    }
  }

  const download = async () => {
    if (!result || downloading) return
    const controller = new AbortController()
    downloadRef.current = controller
    setDownloading(true)
    setError(null)
    let objectUrl: string | undefined
    try {
      const response = result.provider === 'autodl'
        ? await fetch('/api/video-generate/download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: result.videoUrl }),
          signal: controller.signal,
        })
        : await fetch(result.videoUrl, { signal: controller.signal })
      if (!response.ok) throw new DanceGenerationError('download')
      const blob = await response.blob()
      if (!blob.size || (blob.type && !blob.type.startsWith('video/') && blob.type !== 'application/octet-stream')) throw new DanceGenerationError('download')
      if (controller.signal.aborted) return
      objectUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = objectUrl
      const extension = blob.type === 'video/webm' ? 'webm' : blob.type === 'video/quicktime' ? 'mov' : 'mp4'
      link.download = `zombie-couple-video.${extension}`
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch {
      if (!controller.signal.aborted) setError('download')
    } finally {
      // Give the browser time to start saving before releasing its object URL.
      if (objectUrl) setTimeout(() => URL.revokeObjectURL(objectUrl!), 1000)
      if (downloadRef.current === controller) { downloadRef.current = null; setDownloading(false) }
    }
  }

  return (
    <div id="zombie-maker" className={`grid scroll-mt-24 overflow-hidden rounded-[1.75rem] border bg-card shadow-sm lg:grid-cols-[1.08fr_1fr] ${className}`} data-testid="zombie-maker">
      <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-2 bg-[#315b39] px-5 py-4 text-[#fffdf5] sm:px-8 lg:col-span-2">
        <p className="flex flex-wrap items-center gap-x-5 gap-y-1 text-lg font-semibold sm:text-xl">
          <strong>{copy.offerNoLogin}</strong>
          <span className="rounded-full bg-[#f3d995] px-3 py-1 text-sm font-semibold text-[#293d2d]">{copy.offerFree}</span>
        </p>
      </div>
      <form onSubmit={(event) => { void generate(event) }} className="space-y-6 p-5 sm:p-8">
        <noscript><p className="rounded-xl border p-4 text-sm leading-relaxed">{copy.noJavaScriptHint}</p></noscript>
        <p className="rounded-xl border bg-muted/40 p-4 text-sm leading-relaxed">{trialState === 'used' ? copy.trialUsedHint : trialState === 'processing' ? copy.trialPendingHint : copy.trialHint}</p>
        <div className="space-y-3">
          <label htmlFor={`${id}-photo`} className="block text-base font-semibold">{copy.photoLabel}</label>
          <div className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed bg-muted/35 p-5 text-center">
            {previewUrl ? (
              <img src={previewUrl} alt={copy.photoPreviewAlt} width={300} height={300} className="max-h-56 w-full rounded-xl object-contain" />
            ) : <Upload aria-hidden="true" className="h-8 w-8 text-muted-foreground" />}
            {photo && <p className="max-w-full truncate text-sm text-muted-foreground">{photo.name}</p>}
            <Button type="button" variant="outline" onClick={() => inputRef.current?.click()} disabled={referencesLocked}>
              <ImagePlus aria-hidden="true" className="h-4 w-4" />{photo ? copy.changePhoto : copy.choosePhoto}
            </Button>
            <input ref={inputRef} id={`${id}-photo`} type="file" accept={DANCE_PHOTO_ACCEPT} className="sr-only" onChange={choosePhoto} disabled={referencesLocked} aria-required="true" aria-describedby={`${id}-photo-hint`} />
            {photo && <button type="button" onClick={removeDancer} disabled={referencesLocked} className="text-xs text-muted-foreground underline underline-offset-4 disabled:opacity-50">{copy.removePhoto}</button>}
          </div>
          <p id={`${id}-photo-hint`} className="text-sm leading-relaxed text-muted-foreground">{copy.photoHint}</p>
        </div>

        <div className="space-y-3">
          <label htmlFor={`${id}-princess`} className="block text-base font-semibold">{copy.princessLabel}</label>
          <div className="flex flex-col items-center gap-4 rounded-2xl border bg-muted/35 p-4 sm:flex-row">
            <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-background">{princessPreviewUrl ? <img src={princessPreviewUrl} alt={copy.princessPreviewAlt} width={300} height={300} className="h-full w-full object-cover" /> : <Upload aria-hidden="true" className="h-8 w-8 text-muted-foreground" />}</div>
            <div className="min-w-0 space-y-2 text-center sm:text-left">
              <p className="truncate text-sm text-muted-foreground">{princessPhoto?.name ?? copy.defaultPrincessLabel}</p>
              <Button type="button" variant="outline" onClick={() => princessInputRef.current?.click()} disabled={referencesLocked}>
                <ImagePlus aria-hidden="true" className="h-4 w-4" />{princessPhoto ? copy.changePrincess : copy.choosePrincess}
              </Button>
              <input ref={princessInputRef} id={`${id}-princess`} aria-required="true" type="file" accept={DANCE_PHOTO_ACCEPT} className="sr-only" onChange={choosePrincess} disabled={referencesLocked} aria-describedby={`${id}-princess-hint`} />
              {princessPhoto && <button type="button" onClick={restorePrincess} disabled={referencesLocked} className="block w-full text-xs text-muted-foreground underline underline-offset-4 disabled:opacity-50 sm:w-auto">{copy.restorePrincess}</button>}
            </div>
          </div>
          <p id={`${id}-princess-hint`} className="text-sm leading-relaxed text-muted-foreground">{copy.princessHint}</p>
          <p className="text-xs leading-relaxed text-muted-foreground">{copy.photoPrivacyHint}</p>
          <a href="/privacy-policy#photo-retention" className="inline-block text-xs underline underline-offset-4">{copy.photoPrivacyLinkLabel}</a>
        </div>

        <fieldset className="space-y-3" disabled={referencesLocked}>
          <legend className="text-base font-semibold">{copy.storyLabel}</legend>
          <p className="text-sm text-muted-foreground">{copy.storyHint}</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3" data-testid="story-options">
            {zombieVideoConfig.storyIds.map(value => <Button key={value} type="button" variant={storyId === value ? 'default' : 'outline'} aria-pressed={storyId === value} className="h-auto min-h-11 whitespace-normal rounded-xl px-3 py-3" onClick={() => { setStoryId(value); setStory(zombieCoupleEn.stories[value].prompt); clearResult() }}>{zombieCoupleEn.stories[value].name}</Button>)}
          </div>
          <p className="text-sm text-muted-foreground">{zombieCoupleEn.stories[storyId].description}</p>
          <label htmlFor={`${id}-story`} className="block text-sm font-semibold">{copy.customStoryLabel}</label>
          <textarea id={`${id}-story`} value={story} onChange={event => setStory(event.currentTarget.value)} maxLength={zombieVideoConfig.maxStoryLength} rows={5} aria-describedby={`${id}-story-hint`} className="min-h-32 w-full resize-y rounded-xl border bg-background p-3 text-sm leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-primary" />
          <div className="flex justify-between gap-3 text-xs text-muted-foreground"><p id={`${id}-story-hint`}>{copy.customStoryHint}</p><span>{copy.storyCounter.replace('{count}', String(story.length)).replace('{max}', String(zombieVideoConfig.maxStoryLength))}</span></div>
        </fieldset>

        <div className="space-y-3">
          <label className="flex items-start gap-2 text-sm leading-relaxed">
            <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.currentTarget.checked)} disabled={referencesLocked} className="mt-1 h-4 w-4 shrink-0 accent-primary" />
            <span>{copy.consentLabel}</span>
          </label>
          <p className="text-xs leading-relaxed text-muted-foreground">{copy.legalLead} <a href="/terms-of-service" className="underline underline-offset-4">{copy.termsLabel}</a> {copy.legalJoin} <a href="/privacy-policy" className="underline underline-offset-4">{copy.privacyLabel}</a>.</p>
          <Button type="submit" size="lg" className="w-full rounded-xl" disabled={trialLoading || isWorking || checkingPhoto || checkingPrincess || (!canCheckTask && (trialState !== 'available' || !isAvailable || !photo || !princessPhoto || !consent))}>
            {isWorking ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Film aria-hidden="true" className="h-4 w-4" />}
            {canCheckTask ? copy.retryStatus : copy.generateButton}
          </Button>
          <p className="text-center text-xs text-muted-foreground">{costHint}</p>
          {!isAvailable && <p className="rounded-lg bg-muted p-3 text-sm leading-relaxed text-muted-foreground" role="status">{copy.unavailableHint}</p>}
          {error && <p className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive" role="alert">{copy.errors[error]}</p>}
        </div>
      </form>

      <div className="flex flex-col gap-4 border-t bg-muted/30 p-5 sm:p-8 lg:border-l lg:border-t-0" data-testid="generation-result">
        <p className="text-base font-semibold">{copy.resultTitle}</p>
        <div className="relative flex aspect-[4/5] max-h-[640px] w-full shrink-0 items-center justify-center overflow-hidden rounded-2xl border bg-background p-4" aria-busy={isWorking}>
          {result ? (
            <video src={result.videoUrl} poster={result.coverImageUrl} controls playsInline preload="metadata" aria-label={copy.videoLabel} className="absolute inset-0 h-full w-full rounded-2xl object-contain">{copy.videoUnsupported}</video>
          ) : (
            <div className="flex max-w-xs flex-col items-center gap-4 text-center">
              {isWorking ? <LoaderCircle aria-hidden="true" className="h-9 w-9 animate-spin text-primary" /> : <Film aria-hidden="true" className="h-10 w-10 text-muted-foreground/45" />}
              <p className="text-sm leading-relaxed text-muted-foreground">{isWorking ? copy.status[phase] : copy.resultEmpty}</p>
            </div>
          )}
        </div>
        {isWorking && !result && showSlowGenerationHint && <p className="text-xs leading-relaxed text-muted-foreground" role="status">{copy.progressHint}</p>}
        <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status" aria-live="polite">
          {phase === 'succeeded' && <CheckCircle2 aria-hidden="true" className="h-4 w-4 text-primary" />}{copy.status[phase]}
        </p>
        <p className="text-xs leading-relaxed text-muted-foreground">{copy.fidelityHint}</p>
        <div className="space-y-3">
          <Button type="button" onClick={() => { void download() }} disabled={!result || downloading} className="w-full rounded-xl">
            {downloading ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Download aria-hidden="true" className="h-4 w-4" />}{downloading ? copy.downloading : copy.downloadButton}
          </Button>
          <p className="text-xs leading-relaxed text-muted-foreground">{copy.downloadHint}</p>
          {phase === 'failed' && !taskId && trialState === 'available' && <Button type="button" variant="outline" onClick={reset} className="w-full rounded-xl"><RotateCcw aria-hidden="true" className="h-4 w-4" />{copy.resetButton}</Button>}
        </div>
      </div>
    </div>
  )
}
