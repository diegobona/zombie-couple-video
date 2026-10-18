import { homeCopy } from '@/lib/home-copy'
import { zombieVideoConfig } from '../../../../config/zombieVideo'

export function HomeExamples() {
  const examples = zombieVideoConfig.demo.examples.filter(example => Boolean(example.videoUrl))
  if (!examples.length) return null

  return <section aria-labelledby="story-demo" className="min-w-0 scroll-mt-6">
    <h2 id="story-demo" className="mb-3 text-base font-semibold">{homeCopy.demo.heading}</h2>
    <div className="grid grid-cols-3 gap-2 sm:gap-3">{examples.map(example => <figure key={example.id} className="min-w-0">
      <video controls playsInline preload="none" src={example.videoUrl} poster={example.posterUrl || undefined} aria-label={homeCopy.demo.titles[example.id]} data-testid={example.id} className="aspect-[9/16] w-full rounded-xl border bg-black object-contain" />
      <figcaption className="mt-2 text-xs font-semibold leading-5">{homeCopy.demo.titles[example.id]}</figcaption>
    </figure>)}</div>
  </section>
}
