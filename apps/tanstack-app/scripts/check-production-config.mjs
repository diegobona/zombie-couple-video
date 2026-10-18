// This checks committed deployment configuration, not .dev.vars or remote health.
import { readFileSync } from 'node:fs'

const config = JSON.parse(readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8').replace(/^\s*\/\/.*$/gm, ''))
const origin = 'https://zombie-couple-video.net'
const problems = []
for (const key of ['APP_BASE_URL', 'BETTER_AUTH_URL']) {
  if (config.vars?.[key] !== origin) problems.push(`${key} must use ${origin}.`)
}
if (process.env.VITE_SITE_URL && process.env.VITE_SITE_URL.replace(/\/+$/, '') !== origin) problems.push('VITE_SITE_URL conflicts with the owned domain.')
const database = config.d1_databases?.find(binding => binding.binding === 'DB')
if (!database?.database_id || !/^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(database.database_id) || /^0{8}-/.test(database.database_id)) {
  problems.push('DB still has a local placeholder ID. Create the production D1 database, configure its ID and apply remote migrations before deployment.')
}
if (!config.r2_buckets?.some(binding => binding.binding === 'R2_BUCKET' && binding.bucket_name === 'zombie-couple-video-uploads')) problems.push('The dedicated R2_BUCKET binding is missing.')
try {
  const url = new URL(config.vars?.R2_PUBLIC_URL)
  if (url.protocol !== 'https:' || /example|placeholder|localhost/i.test(url.hostname)) throw new Error()
} catch { problems.push('R2_PUBLIC_URL must be a real public HTTPS URL.') }
for (const name of ['BETTER_AUTH_SECRET', 'AUTODL_API_KEY']) {
  if (!config.secrets?.required?.includes(name)) problems.push(`Declare required runtime secret ${name}.`)
}
if (problems.length) {
  console.error('Production configuration is not ready:\n' + problems.map(message => `- ${message}`).join('\n'))
  process.exitCode = 1
} else {
  console.log('Static production configuration passed. This is not a release approval: verify remote D1 migrations, uploaded Worker secrets, provider balance, domain/TLS and a real generation/download before launch. Local .dev.vars are not deployed secrets.')
}
