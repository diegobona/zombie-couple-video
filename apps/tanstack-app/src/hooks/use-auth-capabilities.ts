import { useLoaderData } from '@tanstack/react-router'

export function useAuthCapabilities() {
  return useLoaderData({ from: '__root__', select: (data) => data.auth })
}
