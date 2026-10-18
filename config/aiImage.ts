/**
 * AI Image Generation Configuration
 * Providers: qwen (native HTTP), fal (AI SDK), openai (AI SDK), gemini (AI SDK)
 */

export const aiImageConfig = {
  /**
   * Default Image Provider
   * @type {'qwen' | 'fal' | 'openai' | 'gemini'}
   */
  defaultProvider: 'qwen' as const,

  /**
   * Default Model for each image provider
   */
  defaultModels: {
    qwen: 'qwen-image-3.0-pro',
    fal: 'reve/2.1/text-to-image',
    openai: 'gpt-image-2',
    gemini: 'gemini-3.1-flash-image-preview'
  },

  /**
   * Available Image Models for each provider
   */
  availableModels: {
    qwen: ['qwen-image-3.0-pro', 'qwen-image-3.0'],
    fal: [
      'reve/2.1/text-to-image',
      'bytedance/seedream/v5/pro/text-to-image',
      'fal-ai/flux-2-pro',
    ],
    openai: ['gpt-image-2'],
    gemini: [
      'gemini-3.1-flash-image-preview',
      'gemini-3-pro-image-preview',
    ]
  },

  /**
   * Size options for Qwen (format: width*height)
   */
  qwenSizes: [
    { value: '1664*928', label: '16:9' },
    { value: '1472*1104', label: '4:3' },
    { value: '1328*1328', label: '1:1' },
    { value: '1104*1472', label: '3:4' },
    { value: '928*1664', label: '9:16' },
  ],

  /**
   * Aspect ratio options for fal (format: width:height)
   */
  falAspectRatios: [
    { value: '21:9', label: '21:9' },
    { value: '16:9', label: '16:9' },
    { value: '4:3', label: '4:3' },
    { value: '1:1', label: '1:1' },
    { value: '3:4', label: '3:4' },
    { value: '9:16', label: '9:16' },
    { value: '9:21', label: '9:21' },
  ],

  /**
   * Size options for OpenAI GPT Image 2 (format: widthxheight)
   */
  openaiSizes: [
    { value: '1024x1024', label: '1:1' },
    { value: '1536x1024', label: '3:2' },
    { value: '1024x1536', label: '2:3' },
  ],

  /**
   * Aspect ratio options for Gemini (format: width:height)
   */
  geminiAspectRatios: [
    { value: '21:9', label: '21:9' },
    { value: '16:9', label: '16:9' },
    { value: '5:4', label: '5:4' },
    { value: '4:3', label: '4:3' },
    { value: '3:2', label: '3:2' },
    { value: '1:1', label: '1:1' },
    { value: '2:3', label: '2:3' },
    { value: '3:4', label: '3:4' },
    { value: '4:5', label: '4:5' },
    { value: '9:16', label: '9:16' },
  ],

  /**
   * Default generation parameters
   */
  defaults: {
    numInferenceSteps: 28,
    guidanceScale: 4,
    promptExtend: true,
    watermark: false,
  },
} as const;

// Type exports for external use
export type ImageProviderName = 'qwen' | 'fal' | 'openai' | 'gemini';

/**
 * Get size/aspect ratio options for a provider
 */
export function getImageSizesForProvider(provider: ImageProviderName) {
  switch (provider) {
    case 'qwen': return aiImageConfig.qwenSizes;
    case 'fal': return aiImageConfig.falAspectRatios;
    case 'openai': return aiImageConfig.openaiSizes;
    case 'gemini': return aiImageConfig.geminiAspectRatios;
    default: return [];
  }
}
