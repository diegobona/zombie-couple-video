# AI 视频生成配置

TinyShip 支持 AI 视频生成功能，可集成多个视频生成服务。本文档介绍如何配置 AI 视频生成功能。

## 🔗 相关页面

| 页面 | 路径 | 说明 |
|------|------|------|
| 视频生成页 | `/video-generate` | AI 视频生成界面 |

## 📑 目录

- [支持的视频生成服务](#支持的视频生成服务)
- [配置说明](#配置说明)
- [时长与分辨率](#时长与分辨率)
- [环境变量配置](#环境变量配置)
- [积分消耗配置](#积分消耗配置)
- [火山 Seedance 账单](#火山-seedance-账单)
- [本地测试建议](#本地测试建议)

## 支持的视频生成服务

| 服务 | 模型 | 特点 |
|------|------|------|
| **Fal.ai** | Kling 3.0 Pro 文生/图生, Veo 3.1 | 接入简单，支持文生视频/图生视频 |
| **Volcengine Seedance** | doubao-seedance-2-5-260628, doubao-seedance-2-0-260128 | 2.5 最长 30s（最高 720p），2.0 可到 1080p |
| **Aliyun Wan** | wan3.0-video, wan3.0-video-prime | 文/图生合一，最长 30s |

## 配置说明

AI 视频生成配置位于 `config/aiVideo.ts`：

```typescript
// config/aiVideo.ts
export const aiVideoConfig = {
  defaultProvider: 'volcengine' as const, // 默认视频生成提供商

  defaultModels: {
    fal: 'fal-ai/kling-video/v3/pro/text-to-video',
    volcengine: 'doubao-seedance-2-5-260628',
    aliyun: 'wan3.0-video',
  },

  availableModels: {
    fal: [
      'fal-ai/kling-video/v3/pro/text-to-video',
      'fal-ai/kling-video/v3/pro/image-to-video',
      'fal-ai/veo3.1',
      'fal-ai/veo3.1/image-to-video',
    ],
    volcengine: ['doubao-seedance-2-5-260628', 'doubao-seedance-2-0-260128'],
    aliyun: ['wan3.0-video', 'wan3.0-video-prime'],
  },

  defaults: {
    duration: 5,        // default duration; users can change it in the UI
    promptExtend: true,
    watermark: false,
  },
}
```

时长、分辨率按 **提供商 + 模型** 过滤，由 `getVideoDurationsForProvider()` / `getVideoSizesForProvider()` 提供给三端页面。用户可以自己选，不需要锁死。

## 时长与分辨率

| 模型 | 时长 | 分辨率 |
|------|------|--------|
| Seedance 2.5 | 5 / 10 / 15 / 30 秒 | 最高 720P |
| Seedance 2.0 | 5 / 10 / 15 秒 | 720P / 1080P |
| Kling 3.0 Pro | 5 / 10 / 15 秒 | 多种画幅 |
| Veo 3.1 | 4 / 6 / 8 秒 | 仅 16:9、9:16 |
| Wan 3.0 | 5 / 10 / 15 / 30 秒 | 720P / 1080P |

默认时长是 **5 秒**。火山账单按时长和分辨率涨，建议把默认留在 5 秒 + 720P，避免有人手滑选 30 秒。

## 环境变量配置

在 `.env` 文件中添加对应 API 密钥：

```env
# Fal.ai
FAL_API_KEY="your-fal-api-key"

# Volcengine Seedance
VOLCENGINE_ACCESS_KEY_ID="your-volcengine-api-key"
# 可选，自定义网关地址；未配置时使用默认值
VOLCENGINE_BASE_URL="https://ark.cn-beijing.volces.com"

# Aliyun Wanxiang（复用 Qwen 配置）
QWEN_API_KEY="your-dashscope-api-key"
# 可选，若配置了路径（如 /compatible-mode/v1）系统会自动提取 origin
QWEN_BASE_URL="https://dashscope.aliyuncs.com"
```

## 积分消耗配置

AI 视频生成通常比图片生成消耗更多积分。可在 `config/credits.ts` 中按模型定价：

```typescript
// config/credits.ts
export const creditsConfig = {
  fixedConsumption: {
    // AI 视频生成 - 按模型定价
    aiVideo: {
      default: 30,
      models: {
        'fal-ai/kling-video/v3/pro/text-to-video': 35,
        'fal-ai/kling-video/v3/pro/image-to-video': 35,
        'doubao-seedance-2-5-260628': 40,
        'doubao-seedance-2-0-260128': 35,
        'wan3.0-video': 25,
        'wan3.0-video-prime': 35,
      },
    },
  },
}
```

这是 **对终端用户** 的固定扣分：同一模型无论 5 秒还是 30 秒都扣一样多。火山方舟那边不是这样计费，见下一节。

## 火山 Seedance 账单

Seedance API 按 **Token** 向火山扣费，和 TinyShip 积分是两套账。Token 大致由输出时长、分辨率、帧率、是否带参考视频决定，以任务返回的 `usage.completion_tokens` 为准。

2.5 单价比 2.0 大约贵 50%：

| | 输入不含视频 | 输入含视频 |
|---|---|---|
| Seedance 2.5 | 70 元 / 百万 Token | 42 元 / 百万 Token |
| Seedance 2.0 | 约 46 元 / 百万 Token | 约 28 元 / 百万 Token |

2.5 纯文生（无参考视频）的典型价：

| 分辨率 | 5 秒 | 约每秒 | 30 秒（估算） |
|--------|------|--------|----------------|
| 480P | 约 3.36 元 | ~0.67 元 | 约 20 元 |
| 720P | 约 7.56 元 | ~1.51 元 | 约 45 元 |

图生视频（只传首帧）一般仍走「输入不含视频」档。带参考视频才走更便宜的 Token 单价，但输入时长会计入 Token。

当前 2.5 页面只开放 720P；适配器已能映射 `854x480`，若要压测成本可以把 480P 加进 `volcengineSizes720`。

官方价目：[火山方舟模型价格](https://www.volcengine.com/docs/82379/1544106)

## 本地测试建议

测「能不能出片」时不要用默认的 2.5 + 长时长。

| 目的 | 建议 | 大约火山成本 |
|------|------|----------------|
| 只验证 Seedance 通不通 | **2.0 + 720P + 5 秒**，纯文生 | ~5 元 |
| 必须看 2.5 效果 | 2.5 + 720P + **5 秒** | ~7.5 元 |
| 只测页面 / 轮询 / 积分 | **万相 3.0 Prime** | 通常比 Seedance 便宜 |
| 避免 | 2.5 的 15s/30s、2.0 的 1080P | 十几到几十元 |

Fal / Veo 走境外节点。在国内测时，开发服务（Node）不会走浏览器代理，需要 **TUN 模式** 或给进程设置 `HTTPS_PROXY`，否则会很慢或超时。通义、火山走国内线路，一般不用。

---

相关文档：
- [AI 对话配置](./chat.md)
- [AI 图片生成](./image.md)
- [视频参数对照（实现文档）](../../implementation/video-generation-provider-params-comparison.md)
- [积分系统配置](../credits.md) - 配置积分消耗规则
