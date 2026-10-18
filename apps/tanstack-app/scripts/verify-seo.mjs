import { readdir, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { join, relative } from 'node:path'

const sourceRoot = fileURLToPath(new URL('../src/', import.meta.url))
const failures = []
async function checkDirectory(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = join(directory, entry.name)
    if (entry.isDirectory()) { await checkDirectory(file); continue }
    if (!/\.tsx?$/.test(entry.name) || entry.name === 'routeTree.gen.ts') continue
    const source = await readFile(file, 'utf8')
    const path = relative(sourceRoot, file).replaceAll('\\', '/')
    if (/<meta\b|\bname\s*:\s*['"]keywords['"]/.test(source)) failures.push(`${path}: forbidden inline metadata or keywords`)
    if (/\bssr\s*:\s*(?:false|['"]data-only['"])/.test(source)) failures.push(`${path}: SSR must remain enabled`)
    if (path.startsWith('routes/') && /\bhead\s*:/.test(source)) {
      if (/\bmeta\s*:/.test(source) || !/\bseoHead\s*\(/.test(source)) failures.push(`${path}: generate head exclusively with seoHead`)
    }
  }
}
await checkDirectory(sourceRoot)
if (failures.length) throw new Error(failures.join('\n'))
console.log('SEO source guard passed: centralized metadata, no keywords, SSR enabled.')
