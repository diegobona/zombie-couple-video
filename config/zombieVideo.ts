export const zombieVideoConfig = {
  template: 'zombie-couple-v1',
  storyIds: ['quiet-embrace', 'shelter-reunion', 'sunset-promise', 'lantern-reunion', 'forehead-touch', 'ruins-reunion', 'rainy-reunion', 'snowbound-reunion'],
  defaultStoryId: 'quiet-embrace',
  maxStoryLength: 500,
  duration: 10,
  resolution: '768p竖',
  // Enable each example after its local video and poster have been prepared.
  demo: { examples: [
    { id: 'example-1', videoUrl: '/videos/zombie-couple-example-1.mp4', posterUrl: '/images/zombie-couple-example-1.jpg' },
    { id: 'example-2', videoUrl: '/videos/zombie-couple-example-2.mp4', posterUrl: '/images/zombie-couple-example-2.jpg' },
    { id: 'example-3', videoUrl: '/videos/zombie-couple-example-3.mp4', posterUrl: '/images/zombie-couple-example-3.jpg' },
  ] },
} as const

export type ZombieStoryId = (typeof zombieVideoConfig.storyIds)[number]
