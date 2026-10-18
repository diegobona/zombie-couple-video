/**
 * AI Chat Configuration
 */

export const aiConfig = {
  /**
   * Default AI Provider
   * @type {'qwen' | 'deepseek' | 'openai'}
   */
  defaultProvider: 'qwen' as const,

  /**
   * Default Model for each provider
   */
  defaultModels: {
    qwen: 'qwen3.7-flash',
    deepseek: 'deepseek-v4-flash',
    openai: 'gpt-5.6-sol'
  },

  /**
   * Available Models for each provider
   * These will be displayed in the model selector dropdown
   */
  availableModels: {
    qwen: ['qwen3.8-max', 'qwen3.7-plus', 'qwen3.7-flash'],
    deepseek: ['deepseek-v4-pro', 'deepseek-v4-flash'],
    openai: ['gpt-5.6-sol', 'gpt-5.6-terra', 'gpt-5.6-luna']
  },

  /**
   * Provider API Keys Configuration
   * Note: These are configured via environment variables in libs/ai/config.ts
   * - QWEN_API_KEY and QWEN_BASE_URL
   * - DEEPSEEK_API_KEY
   * - OPENAI_API_KEY and OPENAI_BASE_URL
   * - FAL_API_KEY
   */
} as const;
