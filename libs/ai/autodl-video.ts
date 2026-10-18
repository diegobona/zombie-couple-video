import { aiVideoConfig } from '../../config/aiVideo';
import { getApiKey } from './config';
import type { VideoGenerationOptions, VideoGenerationResult } from './types';

// Workflow input_rules and output_example verified through the official public
// GET /api/v1/comfyui/workflows/minimax_h3_lightx2v_v5 endpoint.
const API_BASE = 'https://autodl.art/api/v1/comfyui/comfyui_workflow';

type JsonObject = Record<string, unknown>;
type AutodlRequest = {
  prompt: string;
  ref_image_0: string;
  duration: number;
  resolution: string;
  seed?: number;
} & Partial<Record<`ref_image_${number}`, string>>;

function asObject(value: unknown): JsonObject | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as JsonObject
    : undefined;
}

function httpUrl(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  try {
    const url = new URL(value.trim());
    if ((url.protocol === 'https:' || url.protocol === 'http:') && !url.username && !url.password) {
      return url.href;
    }
  } catch {
    // Relative URLs and data URLs cannot be fetched by the provider.
  }
  return undefined;
}

function getAutodlConfiguration() {
  const apiKey = getApiKey('autodl').trim();
  if (!apiKey) throw new Error('AutoDL API key is not configured. Set AUTODL_API_KEY.');
  const workflowId = process.env.AUTODL_VIDEO_WORKFLOW_ID?.trim() || aiVideoConfig.autodl.workflowId;
  if (!/^[a-zA-Z0-9_.-]+$/.test(workflowId)) {
    throw new Error('AUTODL_VIDEO_WORKFLOW_ID must be a workflow identifier, not a URL');
  }
  return { apiKey, workflowId };
}

/** Server-only readiness check. Return this boolean through a server function. */
export function isAutodlVideoConfigured(): boolean {
  try {
    getAutodlConfiguration();
    return true;
  } catch {
    return false;
  }
}

function referenceImageUrls(options: VideoGenerationOptions): string[] {
  if (options.referenceImageUrls === undefined) {
    const firstFrameUrl = httpUrl(options.firstFrameUrl);
    if (!firstFrameUrl) throw new Error('AutoDL requires public HTTP(S) referenceImageUrls or firstFrameUrl');
    return [firstFrameUrl];
  }
  const references = options.referenceImageUrls;
  if (!Array.isArray(references) || references.length < 1 || references.length > aiVideoConfig.autodl.maxReferenceImages) {
    throw new Error(`AutoDL referenceImageUrls must contain 1–${aiVideoConfig.autodl.maxReferenceImages} images`);
  }
  return Array.from(references, (value, index) => {
    const url = httpUrl(value);
    if (!url) throw new Error(`AutoDL referenceImageUrls[${index}] must be a public HTTP(S) URL`);
    return url;
  });
}

function buildRequest(options: VideoGenerationOptions): AutodlRequest {
  if (options.model && options.model !== aiVideoConfig.defaultModels.autodl) {
    throw new Error(`Unsupported AutoDL video model: ${options.model}`);
  }
  const prompt = typeof options.prompt === 'string' ? options.prompt.trim() : '';
  if (!prompt || prompt.length > 20000) throw new Error('AutoDL prompt must contain 1–20000 characters');
  const images = referenceImageUrls(options);
  const duration = options.duration ?? aiVideoConfig.defaults.duration;
  if (!Number.isInteger(duration) || duration < 1 || duration > aiVideoConfig.autodl.maxDuration) {
    throw new Error(`AutoDL duration must be an integer between 1 and ${aiVideoConfig.autodl.maxDuration} seconds`);
  }
  const resolution = options.size ?? aiVideoConfig.autodl.defaultResolution;
  if (!aiVideoConfig.autodlSizes.some(size => size.value === resolution)) {
    throw new Error('Unsupported AutoDL resolution');
  }
  const body: AutodlRequest = { prompt, ref_image_0: images[0], duration, resolution };
  images.forEach((url, index) => { body[`ref_image_${index}`] = url; });
  if (options.seed !== undefined) {
    if (!Number.isInteger(options.seed) || options.seed < 1 || options.seed > 999999999999999) {
      throw new Error('AutoDL seed must be an integer between 1 and 999999999999999');
    }
    body.seed = options.seed;
  }
  return body;
}

/** Validate configuration and input before the route consumes credits. */
export function validateAutodlVideoOptions(options: VideoGenerationOptions): void {
  getAutodlConfiguration();
  buildRequest(options);
}

async function request(path: string, apiKey: string, body?: AutodlRequest): Promise<JsonObject> {
  const response = await fetch(`${API_BASE}/${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { 'Authorization': apiKey, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw new Error(`AutoDL API HTTP error: ${response.status}`);
  const envelope = asObject(await response.json());
  if (envelope?.code !== 'Success') {
    const message = typeof envelope?.msg === 'string' && envelope.msg ? envelope.msg : 'Request failed';
    throw new Error(`AutoDL API error: ${String(envelope?.code ?? 'invalid_response')} - ${message}`);
  }
  const data = asObject(envelope.data);
  if (!data) throw new Error('AutoDL API returned an invalid task response');
  return data;
}

export async function autodlCreateVideoTask(options: VideoGenerationOptions): Promise<string> {
  const { apiKey, workflowId } = getAutodlConfiguration();
  const body = buildRequest(options);
  const data = await request(encodeURIComponent(workflowId), apiKey, body);
  if (typeof data.task_id !== 'string' || !data.task_id.trim()) {
    throw new Error('AutoDL API did not return a task_id');
  }
  return data.task_id;
}

/** Extract only documented results URLs, excluding image and arbitrary metadata URLs. */
function getVideoUrl(results: unknown): string | undefined {
  if (!Array.isArray(results)) return undefined;
  for (const result of results) {
    if (typeof result === 'string') {
      const url = httpUrl(result);
      if (url && /\.mp4$/i.test(new URL(url).pathname)) return url;
      continue;
    }
    const item = asObject(result);
    if (!item) continue;
    if (item.output_type !== undefined && item.output_type !== 'output') continue;
    if (item.type !== undefined && item.type !== 'video') continue;
    if (item.file_type !== undefined && item.file_type !== 'mp4') continue;
    if (item.type !== 'video' && item.file_type !== 'mp4') continue;
    const url = httpUrl(item.url);
    if (url) return url;
  }
  return undefined;
}

export async function autodlQueryVideoTask(model: string, taskId: string): Promise<{
  status: 'processing' | 'succeeded' | 'failed';
  result?: VideoGenerationResult;
  errorMessage?: string;
}> {
  const apiKey = getApiKey('autodl').trim();
  if (!apiKey) throw new Error('AutoDL API key is not configured. Set AUTODL_API_KEY.');
  const data = await request(`result/${encodeURIComponent(taskId)}`, apiKey);
  const status = typeof data.status === 'string' ? data.status.toUpperCase() : '';
  if (status === 'QUEUED' || status === 'RUNNING') return { status: 'processing' };
  if (status === 'SUCCESS' || status === 'COMPLETED') {
    const videoUrl = getVideoUrl(data.results);
    return videoUrl
      ? { status: 'succeeded', result: { videoUrl, provider: 'autodl', model } }
      : { status: 'failed', errorMessage: 'AutoDL completed the task without a valid video URL' };
  }
  if (status === 'FAILED') {
    return {
      status: 'failed',
      errorMessage: typeof data.message === 'string' && data.message ? data.message : 'AutoDL video generation failed',
    };
  }
  throw new Error(`AutoDL returned an unknown task status: ${status || 'missing'}`);
}
