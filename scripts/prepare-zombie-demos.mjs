// Run from any directory: node scripts/prepare-zombie-demos.mjs <video-1> <video-2> <video-3>
// Uses supplied local files only; never generates videos or changes the originals.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { resolve, join } from 'node:path'

const root = fileURLToPath(new URL('../', import.meta.url))
const inputs = process.argv.slice(2).map(path => resolve(path))
if (inputs.length !== 3 || inputs.some(path => !existsSync(path))) {
  console.error('Provide three existing local video files.')
  process.exit(1)
}
const publicDir = join(root, 'apps/tanstack-app/public')
mkdirSync(join(publicDir, 'videos'), { recursive: true })
mkdirSync(join(publicDir, 'images'), { recursive: true })
const run = (command, args) => {
  const result = spawnSync(command, args, { encoding: 'utf8', windowsHide: true })
  if (result.error || result.status !== 0) throw new Error(result.error?.message || result.stderr || `${command} failed`)
  return result.stdout
}
for (const [index, input] of inputs.entries()) {
  const number = index + 1
  const output = join(publicDir, `videos/zombie-couple-example-${number}.mp4`)
  const poster = join(publicDir, `images/zombie-couple-example-${number}.jpg`)
  const inputMedia = JSON.parse(run('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_type,codec_name,pix_fmt', '-of', 'json', input]))
  const compatible = inputMedia.streams.some(stream => stream.codec_type === 'video' && stream.codec_name === 'h264' && stream.pix_fmt === 'yuv420p') && inputMedia.streams.every(stream => stream.codec_type !== 'audio' || stream.codec_name === 'aac')
  const codecArgs = compatible ? ['-c', 'copy'] : ['-c:v', 'libx264', '-preset', 'medium', '-crf', '22', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k']
  run('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', input,
    '-map', '0:v:0', '-map', '0:a:0?', ...codecArgs, '-map_metadata', '-1', '-movflags', '+faststart', output])
  run('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-ss', '0.8', '-i', output,
    '-frames:v', '1', '-vf', 'scale=540:-2', '-q:v', '3', poster])
  const media = JSON.parse(run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration:stream=codec_type,codec_name,width,height', '-of', 'json', output]))
  if (!media.streams.some(stream => stream.codec_type === 'video' && stream.codec_name === 'h264')) throw new Error('Prepared video is not H.264')
  console.log(JSON.stringify({ example: number, ...media }))
}
// Enable all examples only after their video/poster preparation succeeds.
const configPath = join(root, 'config/zombieVideo.ts')
const config = readFileSync(configPath, 'utf8')
const pattern = /\{ id: 'example-(1|2|3)', videoUrl: '[^']*', posterUrl: '[^']*' \}/g
if ([...config.matchAll(pattern)].length !== 3) throw new Error('Demo config layout changed; prepared assets exist, but enable their URLs manually.')
writeFileSync(configPath, config.replace(pattern, (_, number) => `{ id: 'example-${number}', videoUrl: '/videos/zombie-couple-example-${number}.mp4', posterUrl: '/images/zombie-couple-example-${number}.jpg' }`))
console.log('Three reference examples enabled. Rebuild and verify playback on desktop/mobile before release.')
