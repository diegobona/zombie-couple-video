import { zombieCoupleEn as copy } from '@libs/i18n/locales/zombie-couple/en'
export const homePage = { path: '/', title: copy.home.title, description: copy.home.description, h1: copy.home.heading, anchorText: copy.name } as const
export function registeredSitemapPaths(discovered: readonly string[]): string[] {
  return [homePage.path].filter(path => discovered.includes(path))
}
