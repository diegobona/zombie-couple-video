import { createFileRoute, redirect } from '@tanstack/react-router'
export const Route = createFileRoute('/zombie-couple-video-generator')({
  beforeLoad: () => { throw redirect({ to: '/', statusCode: 301 }) },
})
