import { generateImage } from 'ai';
import { config } from '@config';
import { createImageProvider } from './providers';
import type {
  ImageProviderName,
  ImageGenerationOptions,
  ImageGenerationResult,
  QwenImageRequest,
  QwenImageResponse,
} from './types';
import { getApiKey, getProviderConfig } from './config';
import { aiImageConfig } from '../../config/aiImage';

// Re-export from config for backwards compatibility
export { getImageSizesForProvider } from '../../config/aiImage';

// Qwen Image API endpoint
const QWEN_IMAGE_ENDPOINT = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation';

const DEFAULT_MODELS: Record<ImageProviderName, string> = {
  qwen: aiImageConfig.defaultModels.qwen,
  fal: aiImageConfig.defaultModels.fal,
  openai: aiImageConfig.defaultModels.openai,
  gemini: aiImageConfig.defaultModels.gemini,
};

function isFlux2Model(model: string): boolean {
  return model.includes('flux-2');
}

/**
 * Map UI aspect ratios to Flux.2 `image_size` enums.
 */
function toFlux2ImageSize(aspectRatio?: string): string {
  switch (aspectRatio) {
    case '16:9':
    case '21:9':
      return 'landscape_16_9';
    case '9:16':
    case '9:21':
      return 'portrait_16_9';
    case '4:3':
      return 'landscape_4_3';
    case '3:4':
      return 'portrait_4_3';
    default:
      return 'square_hd';
  }
}

/**
 * Generate image using Qwen-Image API (native HTTP)
 * Qwen doesn't use AI SDK - requires direct HTTP calls
 */
async function qwenImageGenerate(options: ImageGenerationOptions): Promise<ImageGenerationResult> {
  const config = getProviderConfig('qwen');
  
  if (!config.apiKey) {
    throw new Error('QWEN_API_KEY is not configured');
  }

  const model = options.model || DEFAULT_MODELS.qwen;

  const requestBody: QwenImageRequest = {
    model,
    input: {
      messages: [
        {
          role: 'user',
          content: [{ text: options.prompt }],
        },
      ],
    },
    parameters: {
      negative_prompt: options.negativePrompt,
      prompt_extend: options.promptExtend ?? true,
      watermark: options.watermark ?? false,
      size: options.size || '1328*1328',
      seed: options.seed,
    },
  };

  const response = await fetch(QWEN_IMAGE_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Qwen Image API error: ${response.status} - ${errorText}`);
  }

  const data: QwenImageResponse = await response.json();

  console.log('Qwen Image API response:', JSON.stringify(data, null, 2));

  // Check for API-level errors
  if (data.code) {
    throw new Error(`Qwen Image API error: ${data.code} - ${data.message}`);
  }

  // Extract image URL from response
  // Note: API returns "message" (singular), not "messages"
  const imageUrl = data.output?.choices?.[0]?.message?.content?.[0]?.image;
  
  if (!imageUrl) {
    console.error('Failed to extract image URL. Response structure:', {
      hasOutput: !!data.output,
      hasChoices: !!data.output?.choices,
      choicesLength: data.output?.choices?.length,
      firstChoice: data.output?.choices?.[0],
    });
    throw new Error('No image URL in Qwen Image API response');
  }

  return {
    imageUrl,
    width: data.usage?.width,
    height: data.usage?.height,
    provider: 'qwen',
    model,
  };
}

/**
 * Generate image using fal.ai (Reve, Seedream, FLUX.2)
 */
async function falImageGenerate(options: ImageGenerationOptions): Promise<ImageGenerationResult> {
  const model = options.model || DEFAULT_MODELS.fal;
  const imageProvider = createImageProvider('fal');

  if (!imageProvider) {
    throw new Error('FAL_API_KEY is not configured');
  }

  // FLUX.2 uses image_size enums and rejects Flux.1 inference-step params.
  const falOpts: Record<string, string> = {};
  const useFlux2Size = isFlux2Model(model);
  if (useFlux2Size) {
    falOpts.image_size = toFlux2ImageSize(options.aspectRatio);
  }

  const { image } = await generateImage({
    model: imageProvider.image(model),
    prompt: options.prompt,
    aspectRatio: useFlux2Size ? undefined : options.aspectRatio as `${number}:${number}` | undefined,
    seed: options.seed,
    providerOptions: Object.keys(falOpts).length > 0 ? { fal: falOpts } : undefined,
  });

  const imageUrl = image.base64.startsWith('data:') 
    ? image.base64 
    : `data:${image.mediaType};base64,${image.base64}`;

  return {
    imageUrl,
    provider: 'fal',
    model,
    seed: options.seed,
  };
}

/**
 * Generate image using OpenAI GPT Image 2
 */
async function openaiImageGenerate(options: ImageGenerationOptions): Promise<ImageGenerationResult> {
  const model = options.model || DEFAULT_MODELS.openai;
  if (!getApiKey('openai')) {
    throw new Error('OPENAI_API_KEY is not configured');
  }
  const imageProvider = createImageProvider('openai', getProviderConfig('openai'));
  if (!imageProvider) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const { image } = await generateImage({
    model: imageProvider.image(model),
    prompt: options.prompt,
    size: options.size as `${number}x${number}` | undefined,
    providerOptions: {
      openai: {
        quality: 'high',
      },
    },
  });

  const imageUrl = image.base64.startsWith('data:') 
    ? image.base64 
    : `data:${image.mediaType};base64,${image.base64}`;

  return {
    imageUrl,
    provider: 'openai',
    model,
    seed: options.seed,
  };
}

/**
 * Generate image using Google Gemini
 */
async function geminiImageGenerate(options: ImageGenerationOptions): Promise<ImageGenerationResult> {
  const model = options.model || DEFAULT_MODELS.gemini;
  if (!getApiKey('gemini')) {
    throw new Error('GOOGLE_GENERATIVE_AI_API_KEY is not configured');
  }
  const imageProvider = createImageProvider('gemini');
  if (!imageProvider) {
    throw new Error('GOOGLE_GENERATIVE_AI_API_KEY is not configured');
  }

  const { image } = await generateImage({
    model: imageProvider.image(model),
    prompt: options.prompt,
    aspectRatio: options.aspectRatio as `${number}:${number}` | undefined,
    seed: options.seed,
  });

  const imageUrl = image.base64.startsWith('data:')
    ? image.base64
    : `data:${image.mediaType};base64,${image.base64}`;

  return {
    imageUrl,
    provider: 'gemini',
    model,
    seed: options.seed,
  };
}

/**
 * Main function to generate images with multi-provider support
 */
export async function generateImageResponse(options: ImageGenerationOptions): Promise<ImageGenerationResult> {
  switch (options.provider || 'qwen') {
    case 'qwen':
      return qwenImageGenerate(options);
    case 'fal':
      return falImageGenerate(options);
    case 'openai':
      return openaiImageGenerate(options);
    case 'gemini':
      return geminiImageGenerate(options);
    default:
      throw new Error(`Unsupported image provider: ${options.provider}`);
  }
}

/**
 * Calculate credit consumption for image generation
 * Uses config.credits.fixedConsumption.aiImage for pricing
 * Now uses unified flat format: { default, models: { modelName: cost } }
 */
export function calculateImageCreditCost(options: {
  provider: ImageProviderName;
  model?: string;
}): number {
  const { model } = options;
  const aiImageConfig = config.credits.fixedConsumption.aiImage;

  // Simple number case (all images cost the same)
  if (typeof aiImageConfig === 'number') {
    return aiImageConfig;
  }

  // Check for model-specific cost
  if (model && aiImageConfig.models && model in aiImageConfig.models) {
    return aiImageConfig.models[model];
  }

  // Fall back to default
  return aiImageConfig.default;
}
