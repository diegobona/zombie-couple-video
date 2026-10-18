// Set the framework's existing Cloudflare mode without POSIX-only shell syntax.
import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import './verify-seo.mjs'

const require = createRequire(import.meta.url)
const viteEntry = join(dirname(require.resolve('vite/package.json')), 'bin/vite.js')
const child = spawn(process.execPath, [viteEntry, ...process.argv.slice(2)], {
  stdio: 'inherit',
  env: { ...process.env, CF_DEPLOY: '1' },
})
child.on('error', (error) => { console.error(error.message); process.exitCode = 1 })
child.on('exit', (code) => { process.exitCode = code ?? 1 })
