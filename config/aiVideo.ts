/**
 * AI Video Generation Configuration
 * Providers: fal (AI SDK), volcengine, aliyun, autodl (native HTTP)
 */

export const aiVideoConfig = {
  /**
   * Default Video Provider
   * @type {'fal' | 'volcengine' | 'aliyun' | 'autodl'}
   */
  defaultProvider: 'autodl' as const,

  /**
   * Default Model for each video provider
   */
  defaultModels: {
    fal: 'fal-ai/kling-video/v3/pro/text-to-video',
    volcengine: 'doubao-seedance-2-5-260628',
    aliyun: 'wan3.0-video',
    autodl: 'minimax-h3',
  },

  /**
   * Available Video Models for each provider
   */
  availableModels: {
    fal: [
      'fal-ai/kling-video/v3/pro/text-to-video',
      'fal-ai/kling-video/v3/pro/image-to-video',
      'fal-ai/veo3.1',
      'fal-ai/veo3.1/image-to-video',
    ],
    volcengine: ['doubao-seedance-2-5-260628', 'doubao-seedance-2-0-260128'],
    aliyun: ['wan3.0-video', 'wan3.0-video-prime'],
    autodl: ['minimax-h3'],
  },

  /** Public workflow identifiers and supported input rules; credentials stay server-side. */
  autodl: {
    workflowId: 'minimax_h3_lightx2v_v5',
    defaultResolution: '768p横',
    maxDuration: 10,
    maxReferenceImages: 9,
  },
  autodlSizes: [
    { value: '480p竖', label: '480P 9:16' },
    { value: '768p竖', label: '768P 9:16' },
    { value: '1080p竖', label: '1080P 9:16' },
    { value: '480p横', label: '480P 16:9' },
    { value: '768p横', label: '768P 16:9' },
    { value: '1080p横', label: '1080P 16:9' },
    { value: '480p(1:1)', label: '480P 1:1' },
    { value: '768p(1:1)', label: '768P 1:1' },
    { value: '1080p(1:1)', label: '1080P 1:1' },
  ],

  /**
   * Aspect ratio options for fal Kling (format: width:height)
   */
  falAspectRatios: [
    { value: '16:9', label: '16:9' },
    { value: '9:16', label: '9:16' },
    { value: '1:1', label: '1:1' },
    { value: '4:3', label: '4:3' },
    { value: '3:4', label: '3:4' },
    { value: '21:9', label: '21:9' },
    { value: '9:21', label: '9:21' },
  ],

  /**
   * Aspect ratio options for Google Veo 3.1 (only 16:9 and 9:16)
   */
  falVeoAspectRatios: [
    { value: '16:9', label: '16:9' },
    { value: '9:16', label: '9:16' },
  ],

  /**
   * Size options for Seedance 2.0 (includes 1080p)
   */
  volcengineSizes: [
    { value: '1920x1080', label: '1080P 16:9' },
    { value: '1080x1920', label: '1080P 9:16' },
    { value: '1280x720', label: '720P 16:9' },
    { value: '720x1280', label: '720P 9:16' },
  ],

  /**
   * Size options for Seedance 2.5 (max 720p)
   */
  volcengineSizes720: [
    { value: '1280x720', label: '720P 16:9' },
    { value: '720x1280', label: '720P 9:16' },
  ],

  /**
   * Size options for Aliyun Wan 3.0 (format: width*height)
   */
  aliyunSizes: [
    { value: '1920*1080', label: '1080P 16:9' },
    { value: '1080*1920', label: '1080P 9:16' },
    { value: '1280*720', label: '720P 16:9' },
    { value: '720*1280', label: '720P 9:16' },
    { value: '1080*1080', label: '1080P 1:1' },
  ],

  /**
   * Default generation parameters
   */
  defaults: {
    duration: 10,
    promptExtend: true,
    watermark: false,
  },

  /**
   * Polling configuration for async providers
   */
  polling: {
    /** Interval between status checks in milliseconds */
    intervalMs: 3000,
    /** Maximum polling duration in milliseconds (10 minutes) */
    maxTimeoutMs: 600000,
  },
} as const;

// Type exports for external use
export type VideoProviderName = 'fal' | 'volcengine' | 'aliyun' | 'autodl';

function isVeoModel(model?: string): boolean {
  return Boolean(model && model.includes('veo3'));
}

function isSeedance25(model?: string): boolean {
  return Boolean(model && model.includes('seedance-2-5'));
}

function isKlingV3(model?: string): boolean {
  return Boolean(model && model.includes('kling-video/v3'));
}

/**
 * Get size/aspect ratio options for a video provider (and optional model)
 */
export function getVideoSizesForProvider(provider: VideoProviderName, model?: string) {
  switch (provider) {
    case 'fal':
      return isVeoModel(model) ? aiVideoConfig.falVeoAspectRatios : aiVideoConfig.falAspectRatios;
    case 'volcengine':
      return isSeedance25(model) ? aiVideoConfig.volcengineSizes720 : aiVideoConfig.volcengineSizes;
    case 'aliyun':
      return aiVideoConfig.aliyunSizes;
    case 'autodl':
      return aiVideoConfig.autodlSizes;
    default:
      return [];
  }
}

/**
 * Get duration options (seconds) for a video provider and model
 */
export function getVideoDurationsForProvider(provider: VideoProviderName, model?: string): number[] {
  if (provider === 'autodl') return [5, 10];
  if (provider === 'fal') {
    if (isVeoModel(model)) return [4, 6, 8];
    if (isKlingV3(model)) return [5, 10, 15];
    return [5, 10];
  }

  if (provider === 'volcengine') {
    if (isSeedance25(model)) return [5, 10, 15, 30];
    return [5, 10, 15];
  }

  // Aliyun Wan 3.0: 2–30 seconds
  return [5, 10, 15, 30];
}
