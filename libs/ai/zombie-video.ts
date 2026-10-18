import type { VideoGenerationOptions } from './types'
import { aiVideoConfig } from '../../config/aiVideo'
import { zombieVideoConfig, type ZombieStoryId } from '../../config/zombieVideo'
import { zombieCoupleEn } from '../i18n/locales/zombie-couple/en'

function referenceUrl(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error('Two reference image URLs are required')
  let url: URL
  try { url = new URL(value) } catch { throw new Error('Invalid reference image URL') }
  if (url.protocol !== 'https:' || url.username || url.password || url.hash) throw new Error('Reference images must use HTTPS')
  return url.href
}

export function createZombieVideoOptions(input: Record<string, unknown>): VideoGenerationOptions {
  if (input.storyTemplate !== zombieVideoConfig.template) throw new Error('Unknown story template')
  if (input.consent !== true) throw new Error('Photo permission is required')
  if (typeof input.storyId !== 'string' || !zombieVideoConfig.storyIds.includes(input.storyId as ZombieStoryId)) throw new Error('Unknown story')
  if (input.story !== undefined && typeof input.story !== 'string') throw new Error('Story must be text')
  const text = (input.story as string | undefined)?.trim() || zombieCoupleEn.stories[input.storyId as ZombieStoryId].prompt
  if (text.length > zombieVideoConfig.maxStoryLength) throw new Error('Story is too long')
  const survivor = referenceUrl(input.survivorImageUrl)
  const partner = referenceUrl(input.partnerImageUrl)
  if (survivor === partner) throw new Error('Upload a separate portrait for each role')
  return {
    provider: 'autodl', model: aiVideoConfig.defaultModels.autodl,
    duration: zombieVideoConfig.duration, size: zombieVideoConfig.resolution,
    referenceImageUrls: [survivor, partner],
    prompt: `Create a photorealistic short vertical love story with exactly two adults. Reference image 1 is the living survivor; reference image 2 is their zombie partner. Keep the two distinct identities, hair and clothes consistent. The survivor always stays human. The partner has mild pale zombie makeup and subtle dark veins but a recognizable face, without wounds or gore. Use a stable two-shot when they meet and embrace; keep their screen positions and avoid changing the camera side or adding people. Do not duplicate, replace or swap either person.\n\nStory direction:\n${text}\n\nKeep the action simple for a ${zombieVideoConfig.duration}-second clip. Unless the story explicitly requests a memory cut, keep one continuous scene without a location change. Use slow movements, let one gesture settle before the next, and keep both faces readable. If there is a happy-memory scene, show the same two people healthy again in warm light with their original identities. Natural movement and anatomically coherent contact. No firing, biting or attack. No captions or logos. Ambient sound only, no dialogue or added song.`,
  }
}
