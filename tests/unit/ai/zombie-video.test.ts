import { describe, expect, it } from 'vitest'
import { createZombieVideoOptions } from '../../../libs/ai/zombie-video'
import { zombieVideoConfig } from '../../../config/zombieVideo'
import { zombieCoupleEn } from '../../../libs/i18n/locales/zombie-couple/en'
import { zombieCoupleZhCN } from '../../../libs/i18n/locales/zombie-couple/zh-CN'

const input = { storyTemplate: 'zombie-couple-v1', storyId: 'ruins-reunion', survivorImageUrl: 'https://media.example.org/survivor.jpg', partnerImageUrl: 'https://media.example.org/partner.jpg', consent: true }
describe('zombie couple requests', () => {
  it.each(zombieVideoConfig.storyIds)('accepts the complete editable %s preset', storyId => {
    const story = zombieCoupleEn.stories[storyId]
    expect(story.prompt.length).toBeLessThanOrEqual(zombieVideoConfig.maxStoryLength)
    expect(story.prompt.length).toBeGreaterThan(50)
    expect(zombieCoupleZhCN.stories[storyId].prompt.length).toBeGreaterThan(0)
    expect(zombieCoupleEn.storyGuide.notes[storyId]).toBeTruthy()
    expect(zombieCoupleZhCN.storyGuide.notes[storyId]).toBeTruthy()
    const result = createZombieVideoOptions({ ...input, storyId })
    expect(result.prompt).toContain(story.prompt)
    expect(result.referenceImageUrls).toEqual([input.survivorImageUrl, input.partnerImageUrl])
    expect(createZombieVideoOptions({ ...input, storyId, story: 'We stand together quietly.' }).prompt).toContain('We stand together quietly.')
  })
  it('requires two distinct adult-photo roles and explicit permission', () => {
    expect(() => createZombieVideoOptions({ ...input, partnerImageUrl: undefined })).toThrow()
    expect(() => createZombieVideoOptions({ ...input, partnerImageUrl: input.survivorImageUrl })).toThrow()
    expect(() => createZombieVideoOptions({ ...input, consent: false })).toThrow()
    expect(() => createZombieVideoOptions({ ...input, partnerImageUrl: 'file:///private.jpg' })).toThrow()
  })
  it('uses the selected default but accepts an edited story', () => {
    expect(createZombieVideoOptions(input).prompt).toContain('summer meadow')
    expect(createZombieVideoOptions({ ...input, storyId: 'rainy-reunion' }).prompt).toContain('by the sea')
    expect(createZombieVideoOptions({ ...input, story: 'We touch foreheads in the rain.' }).prompt).toContain('We touch foreheads in the rain.')
  })
  it('rejects invalid stories before a provider request', () => {
    expect(() => createZombieVideoOptions({ ...input, storyId: 'unknown' })).toThrow()
    expect(() => createZombieVideoOptions({ ...input, story: 'a'.repeat(501) })).toThrow()
    expect(() => createZombieVideoOptions({ ...input, story: {} })).toThrow()
  })
  it('keeps provider, duration, resolution and image order server-owned', () => {
    const result = createZombieVideoOptions({ ...input, provider: 'fal', duration: 999, size: '1080p横', referenceImageUrls: ['https://attacker.example/image.jpg'] })
    expect(result.provider).toBe('autodl')
    expect(result.duration).toBe(10)
    expect(result.size).toBe('768p竖')
    expect(result.referenceImageUrls).toEqual([input.survivorImageUrl, input.partnerImageUrl])
  })
})
