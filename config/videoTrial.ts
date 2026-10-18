// The current launch offer. Counters are durable and enforced before provider calls.
export const videoTrialConfig = {
  cookieName: 'zombie_couple_visitor',
  cookieMaxAge: 365 * 24 * 60 * 60,
  ipWindowSeconds: 60 * 60,
  ipLimits: { session: 10, upload: 20, generate: 5 },
} as const
