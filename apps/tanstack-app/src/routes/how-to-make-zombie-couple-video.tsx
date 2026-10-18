import { createFileRoute, redirect } from '@tanstack/react-router'
export const Route = createFileRoute('/how-to-make-zombie-couple-video')({
  beforeLoad: () => { throw redirect({ to: '/', hash: 'how-to-make', statusCode: 301 }) },
})
