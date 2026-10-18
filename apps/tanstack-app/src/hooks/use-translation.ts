import { en } from '@libs/i18n/locales/en'
import { createNextTranslationFunction } from '@libs/validators'

// Compatibility bridge for the existing TinyShip forms and shared components.
// This application has a single English interface and no locale routing.
const tWithParams = createNextTranslationFunction(en)

export function useTranslation() {
  return {
    t: en,
    tWithParams,
    locale: 'en',
    defaultLocale: 'en',
    isDefaultLocale: true,
  } as const
}
