import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';

// We need to mock the config before importing the calculator
// This allows us to test different consumption modes

describe('Credits Calculator', () => {
  // Store original config
  let mockConfig: any;

  beforeEach(() => {
    // Reset modules to allow fresh config mocking
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Dynamic Consumption Mode', () => {
    beforeEach(async () => {
      // Mock config for dynamic mode
      mockConfig = {
        credits: {
          consumptionMode: 'dynamic',
          fixedConsumption: {
            aiChat: 1,
            aiImage: {
              default: 10,
              models: {
                'qwen-image-3.0-pro': 8,
                'gpt-image-2': 15,
              }
            }
          },
          dynamicConsumption: {
            tokensPerCredit: 1000, // 1000 tokens = 1 credit
            modelMultipliers: {
              'gpt-5.6-sol': 2.0,
              'gpt-5.6-terra': 1.5,
              'qwen3.8-max': 1.2,
              'qwen3.7-plus': 1.0,
              'deepseek-v4-flash': 0.8,
              'qwen3.7-flash': 0.5,
              'default': 1.0
            }
          }
        }
      };
      
      vi.doMock('@config', () => ({ config: mockConfig }));
      vi.doMock('../../config/credits', () => ({
        resolveFixedConsumption: (cfg: any, model?: string) => {
          if (typeof cfg === 'number') return cfg;
          if (model && cfg.models?.[model] !== undefined) return cfg.models[model];
          return cfg.default;
        }
      }));
    });

    test('should calculate credits for exact token count', async () => {
      const { calculateCreditConsumption } = await import('@libs/credits/calculator');
      
      // 1000 tokens with 1.0 multiplier = 1 credit
      const result = calculateCreditConsumption({
        totalTokens: 1000,
        model: 'qwen3.7-plus',
        provider: 'openai'
      });
      
      expect(result).toBe(1);
    });

    test('should round up partial credits', async () => {
      const { calculateCreditConsumption } = await import('@libs/credits/calculator');
      
      // 1001 tokens with 1.0 multiplier = 2 credits (ceil)
      const result = calculateCreditConsumption({
        totalTokens: 1001,
        model: 'qwen3.7-plus',
        provider: 'openai'
      });
      
      expect(result).toBe(2);
    });

    test('should apply premium model multiplier (gpt-5.6-sol)', async () => {
      const { calculateCreditConsumption } = await import('@libs/credits/calculator');
      
      // 1000 tokens * 2.0 multiplier = 2 credits
      const result = calculateCreditConsumption({
        totalTokens: 1000,
        model: 'gpt-5.6-sol',
        provider: 'openai'
      });
      
      expect(result).toBe(2);
    });

    test('should apply economy model multiplier (qwen3.7-flash)', async () => {
      const { calculateCreditConsumption } = await import('@libs/credits/calculator');
      
      // 1000 tokens * 0.5 multiplier = 1 credit (rounded up from 0.5)
      const result = calculateCreditConsumption({
        totalTokens: 1000,
        model: 'qwen3.7-flash',
        provider: 'qwen'
      });
      
      expect(result).toBe(1);
    });

    test('should use default multiplier for unknown models', async () => {
      const { calculateCreditConsumption } = await import('@libs/credits/calculator');
      
      // 1000 tokens * 1.0 default multiplier = 1 credit
      const result = calculateCreditConsumption({
        totalTokens: 1000,
        model: 'unknown-model',
        provider: 'unknown'
      });
      
      expect(result).toBe(1);
    });

    test('should ensure minimum 1 credit for small token counts', async () => {
      const { calculateCreditConsumption } = await import('@libs/credits/calculator');
      
      // 100 tokens with 0.5 multiplier = 0.05 credits -> ceil to 1, max with 1 = 1
      const result = calculateCreditConsumption({
        totalTokens: 100,
        model: 'qwen3.7-flash',
        provider: 'qwen'
      });
      
      expect(result).toBeGreaterThanOrEqual(1);
    });

    test('should handle large token counts correctly', async () => {
      const { calculateCreditConsumption } = await import('@libs/credits/calculator');
      
      // 50000 tokens with 2.0 multiplier = 100 credits
      const result = calculateCreditConsumption({
        totalTokens: 50000,
        model: 'gpt-5.6-sol',
        provider: 'openai'
      });
      
      expect(result).toBe(100);
    });

    test('should calculate correctly with deepseek economy multiplier', async () => {
      const { calculateCreditConsumption } = await import('@libs/credits/calculator');
      
      // 5000 tokens * 0.8 multiplier = 4 credits
      const result = calculateCreditConsumption({
        totalTokens: 5000,
        model: 'deepseek-v4-flash',
        provider: 'deepseek'
      });
      
      expect(result).toBe(4);
    });
  });

  describe('Fixed Consumption Mode', () => {
    beforeEach(async () => {
      // Mock config for fixed mode with simple number
      mockConfig = {
        credits: {
          consumptionMode: 'fixed',
          fixedConsumption: {
            aiChat: 5 // Fixed 5 credits per chat (simple number format)
          },
          dynamicConsumption: {
            tokensPerCredit: 1000,
            modelMultipliers: {
              'default': 1.0
            }
          }
        }
      };
      
      vi.doMock('@config', () => ({ config: mockConfig }));
      vi.doMock('../../config/credits', () => ({
        resolveFixedConsumption: (cfg: any, model?: string) => {
          if (typeof cfg === 'number') return cfg;
          if (model && cfg.models?.[model] !== undefined) return cfg.models[model];
          return cfg.default;
        }
      }));
    });

    test('should return fixed amount regardless of token count', async () => {
      const { calculateCreditConsumption } = await import('@libs/credits/calculator');
      
      const result = calculateCreditConsumption({
        totalTokens: 10000,
        model: 'gpt-5.6-sol',
        provider: 'openai'
      });
      
      expect(result).toBe(5);
    });

    test('should return fixed amount for small token counts', async () => {
      const { calculateCreditConsumption } = await import('@libs/credits/calculator');
      
      const result = calculateCreditConsumption({
        totalTokens: 10,
        model: 'gpt-5.6-sol',
        provider: 'openai'
      });
      
      expect(result).toBe(5);
    });

    test('should ignore model multipliers in fixed mode', async () => {
      const { calculateCreditConsumption } = await import('@libs/credits/calculator');
      
      // Even with premium model, should return fixed amount
      const result = calculateCreditConsumption({
        totalTokens: 1000,
        model: 'gpt-5.6-sol', // 2.0 multiplier, but should be ignored
        provider: 'openai'
      });
      
      expect(result).toBe(5);
    });
  });

  describe('Fixed Mode with Object Config (Model-specific pricing)', () => {
    beforeEach(async () => {
      // Mock config for fixed mode with object (model-specific pricing)
      mockConfig = {
        credits: {
          consumptionMode: 'fixed',
          fixedConsumption: {
            aiChat: {
              default: 1,
              models: {
                'gpt-5.6-sol': 3,
                'gpt-5.6-terra': 2,
                'qwen3.7-flash': 1
              }
            }
          },
          dynamicConsumption: {
            tokensPerCredit: 1000,
            modelMultipliers: { 'default': 1.0 }
          }
        }
      };
      
      vi.doMock('@config', () => ({ config: mockConfig }));
      vi.doMock('../../config/credits', () => ({
        resolveFixedConsumption: (cfg: any, model?: string) => {
          if (typeof cfg === 'number') return cfg;
          if (model && cfg.models?.[model] !== undefined) return cfg.models[model];
          return cfg.default;
        }
      }));
    });

    test('should return model-specific cost for gpt-5.6-sol', async () => {
      const { calculateCreditConsumption } = await import('@libs/credits/calculator');
      
      const result = calculateCreditConsumption({
        totalTokens: 1000,
        model: 'gpt-5.6-sol',
        provider: 'openai'
      });
      
      expect(result).toBe(3);
    });

    test('should return model-specific cost for gpt-5.6-terra', async () => {
      const { calculateCreditConsumption } = await import('@libs/credits/calculator');
      
      const result = calculateCreditConsumption({
        totalTokens: 1000,
        model: 'gpt-5.6-terra',
        provider: 'openai'
      });
      
      expect(result).toBe(2);
    });

    test('should return default cost for unknown model', async () => {
      const { calculateCreditConsumption } = await import('@libs/credits/calculator');
      
      const result = calculateCreditConsumption({
        totalTokens: 1000,
        model: 'unknown-model',
        provider: 'openai'
      });
      
      expect(result).toBe(1); // default
    });
  });

  describe('Helper Functions', () => {
    beforeEach(async () => {
      mockConfig = {
        credits: {
          consumptionMode: 'dynamic',
          fixedConsumption: {
            aiChat: 1,
            aiImage: {
              default: 10,
              models: {
                'qwen-image-3.0-pro': 8,
                'gpt-image-2': 15,
              }
            }
          },
          dynamicConsumption: {
            tokensPerCredit: 1000,
            modelMultipliers: {
              'gpt-5.6-sol': 2.0,
              'default': 1.0
            }
          }
        }
      };
      
      vi.doMock('@config', () => ({ config: mockConfig }));
      vi.doMock('../../config/credits', () => ({
        resolveFixedConsumption: (cfg: any, model?: string) => {
          if (typeof cfg === 'number') return cfg;
          if (model && cfg.models?.[model] !== undefined) return cfg.models[model];
          return cfg.default;
        }
      }));
    });

    test('isDynamicMode should return true in dynamic mode', async () => {
      const { isDynamicMode } = await import('@libs/credits/calculator');
      
      expect(isDynamicMode()).toBe(true);
    });

    test('getModelMultiplier should return correct multiplier', async () => {
      const { getModelMultiplier } = await import('@libs/credits/calculator');
      
      expect(getModelMultiplier('gpt-5.6-sol')).toBe(2.0);
      expect(getModelMultiplier('default')).toBe(1.0);
    });

    test('getModelMultiplier should return default for unknown models', async () => {
      const { getModelMultiplier } = await import('@libs/credits/calculator');
      
      expect(getModelMultiplier('unknown-model')).toBe(1.0);
    });

    test('getFixedConsumptionAmount should return correct amount for simple number', async () => {
      const { getFixedConsumptionAmount } = await import('@libs/credits/calculator');
      
      expect(getFixedConsumptionAmount('aiChat')).toBe(1);
    });

    test('getFixedConsumptionAmount should return default for aiImage without model', async () => {
      const { getFixedConsumptionAmount } = await import('@libs/credits/calculator');
      
      expect(getFixedConsumptionAmount('aiImage')).toBe(10);
    });

    test('getFixedConsumptionAmount should return model-specific cost for aiImage', async () => {
      const { getFixedConsumptionAmount } = await import('@libs/credits/calculator');
      
      expect(getFixedConsumptionAmount('aiImage', 'qwen-image-3.0-pro')).toBe(8);
      expect(getFixedConsumptionAmount('aiImage', 'gpt-image-2')).toBe(15);
    });
  });

  describe('AI Image Credit Calculation', () => {
    beforeEach(async () => {
      // Using new unified flat format for aiImage
      mockConfig = {
        credits: {
          consumptionMode: 'dynamic',
          fixedConsumption: {
            aiChat: 1,
            aiImage: {
              default: 10,
              models: {
                'qwen-image-3.0-pro': 8,
                'qwen-image-3.0': 5,
                'reve/2.1/text-to-image': 12,
                'fal-ai/flux-2-pro': 10,
                'gpt-image-2': 15,
              }
            }
          },
          dynamicConsumption: {
            tokensPerCredit: 1000,
            modelMultipliers: { 'default': 1.0 }
          }
        }
      };
      
      vi.doMock('@config', () => ({ config: mockConfig }));
    });

    test('should return default for unknown model', async () => {
      const { calculateImageCreditCost } = await import('@libs/ai/image');
      
      const result = calculateImageCreditCost({
        provider: 'qwen',
        model: 'unknown-model'
      });
      
      expect(result).toBe(10); // global default
    });

    test('should return model-specific cost for qwen-image-3.0-pro', async () => {
      const { calculateImageCreditCost } = await import('@libs/ai/image');
      
      const result = calculateImageCreditCost({
        provider: 'qwen',
        model: 'qwen-image-3.0-pro'
      });
      
      expect(result).toBe(8);
    });

    test('should return model-specific cost for gpt-image-2', async () => {
      const { calculateImageCreditCost } = await import('@libs/ai/image');
      
      const result = calculateImageCreditCost({
        provider: 'openai',
        model: 'gpt-image-2'
      });
      
      expect(result).toBe(15);
    });

    test('should return fal model-specific cost', async () => {
      const { calculateImageCreditCost } = await import('@libs/ai/image');
      
      const result = calculateImageCreditCost({
        provider: 'fal',
        model: 'fal-ai/flux-2-pro'
      });
      
      expect(result).toBe(10);
    });

    test('should return default for unknown fal model', async () => {
      const { calculateImageCreditCost } = await import('@libs/ai/image');
      
      const result = calculateImageCreditCost({
        provider: 'fal',
        model: 'fal-ai/unknown-model'
      });
      
      expect(result).toBe(10); // global default (no provider default anymore)
    });
  });

  describe('Edge Cases', () => {
    beforeEach(async () => {
      mockConfig = {
        credits: {
          consumptionMode: 'dynamic',
          fixedConsumption: {
            aiChat: 1
          },
          dynamicConsumption: {
            tokensPerCredit: 1000,
            modelMultipliers: {
              'gpt-5.6-sol': 2.0,
              'default': 1.0
            }
          }
        }
      };
      
      vi.doMock('@config', () => ({ config: mockConfig }));
      vi.doMock('../../config/credits', () => ({
        resolveFixedConsumption: (cfg: any, model?: string) => {
          if (typeof cfg === 'number') return cfg;
          if (model && cfg.models?.[model] !== undefined) return cfg.models[model];
          return cfg.default;
        }
      }));
    });

    test('should handle zero tokens', async () => {
      const { calculateCreditConsumption } = await import('@libs/credits/calculator');
      
      const result = calculateCreditConsumption({
        totalTokens: 0,
        model: 'gpt-5.6-sol',
        provider: 'openai'
      });
      
      // Math.ceil(0) = 0, Math.max(1, 0) = 1
      expect(result).toBe(1);
    });

    test('should handle very small token counts', async () => {
      const { calculateCreditConsumption } = await import('@libs/credits/calculator');
      
      const result = calculateCreditConsumption({
        totalTokens: 1,
        model: 'default',
        provider: 'openai'
      });
      
      // 1/1000 * 1.0 = 0.001 -> ceil = 1 -> max(1, 1) = 1
      expect(result).toBe(1);
    });

    test('should handle boundary at exact credit threshold', async () => {
      const { calculateCreditConsumption } = await import('@libs/credits/calculator');
      
      // Exactly 2000 tokens with 1.0 multiplier = 2 credits
      const result = calculateCreditConsumption({
        totalTokens: 2000,
        model: 'default',
        provider: 'openai'
      });
      
      expect(result).toBe(2);
    });

    test('should handle boundary just above threshold', async () => {
      const { calculateCreditConsumption } = await import('@libs/credits/calculator');
      
      // 2001 tokens with 1.0 multiplier = 2.001 -> ceil = 3 credits
      const result = calculateCreditConsumption({
        totalTokens: 2001,
        model: 'default',
        provider: 'openai'
      });
      
      expect(result).toBe(3);
    });
  });
});
