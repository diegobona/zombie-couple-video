# AI 图片生成配置

TinyShip 支持 AI 图片生成功能，可以集成多个图片生成服务。本文档介绍如何配置 AI 图片生成功能。

## 🔗 相关页面

| 页面 | 路径 | 说明 |
|------|------|------|
| 图片生成页 | `/image-generate` | AI 图片生成界面 |

## 📑 目录

- [支持的图片生成服务](#支持的图片生成服务)
- [配置说明](#配置说明)
- [环境变量配置](#环境变量配置)
- [积分消耗配置](#积分消耗配置)

## 支持的图片生成服务

| 服务 | 模型 | 特点 |
|------|------|------|
| **Qwen Image** | qwen-image-3.0-pro, qwen-image-3.0 | 通义千问图像 3.0，中文理解好 |
| **Fal.ai** | Reve 2.1, Seedream 5.0 Pro, FLUX.2 Pro | 国际补齐，高质量文生图 |
| **OpenAI** | gpt-image-2 | GPT Image 2 |
| **Gemini** | Nano Banana 2, Nano Banana Pro | Gemini 原生图像模型 |

## 配置说明

AI 图片生成的配置位于 `config/aiImage.ts`：

```typescript
// config/aiImage.ts
export const aiImageConfig = {
  defaultProvider: 'qwen' as const,        // 默认图片生成提供商
  
  defaultModels: {
    qwen: 'qwen-image-3.0-pro',
    fal: 'reve/2.1/text-to-image',
    openai: 'gpt-image-2',
    gemini: 'gemini-3.1-flash-image-preview'
  },
  
  availableModels: {
    qwen: ['qwen-image-3.0-pro', 'qwen-image-3.0'],
    fal: ['reve/2.1/text-to-image', 'bytedance/seedream/v5/pro/text-to-image', 'fal-ai/flux-2-pro'],
    openai: ['gpt-image-2'],
    gemini: ['gemini-3.1-flash-image-preview', 'gemini-3-pro-image-preview']
  }
}
```

## 环境变量配置

在 `.env` 文件中添加对应的 API 密钥：

```env
# Qwen Image (通义万相)
QWEN_API_KEY="your-qwen-api-key"

# Fal.ai
FAL_API_KEY="your-fal-api-key"

# OpenAI GPT Image / GPT-5.6 chat
OPENAI_API_KEY="your-openai-api-key"
# OPENAI_BASE_URL="https://api.openai.com/v1"

# Google Gemini image (Nano Banana)
GOOGLE_GENERATIVE_AI_API_KEY="your-gemini-api-key"
# Optional third-party Gemini gateway. Leave unset for Google's official API.
# GOOGLE_GENERATIVE_AI_BASE_URL="https://generativelanguage.googleapis.com/v1beta"
```

## 积分消耗配置

AI 图片生成通常消耗更多积分，可以在 `config/credits.ts` 中配置不同模型的积分消耗：

```typescript
// config/credits.ts
export const creditsConfig = {
  fixedConsumption: {
    // AI 图片生成 - 按模型定价
    aiImage: {
      default: 10,
      models: {
        'qwen-image-3.0-pro': 8,
        'qwen-image-3.0': 5,
        'reve/2.1/text-to-image': 12,
        'gpt-image-2': 15,
        'gemini-3.1-flash-image-preview': 10,
        'gemini-3-pro-image-preview': 15,
      }
    },
  },
}
```

---

相关文档：
- [AI 对话配置](./chat.md)
- [积分系统配置](../credits.md) - 配置积分消耗规则
