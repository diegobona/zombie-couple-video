# Waffo Pancake 配置

Waffo Pancake 是一个全球化的支付平台，采用 Merchant of Record（记录商家）模式，替开发者处理税务、合规和退款。支持托管结账页面，适合面向全球市场的 SaaS 和数字产品。

官方文档：[https://docs.waffo.ai](https://docs.waffo.ai)

## 目录

- [申请流程](#申请流程)
- [环境变量配置](#环境变量配置)
- [特性](#特性)
- [测试模式](#测试模式)
- [Webhook 配置](#webhook-配置)
- [计划配置示例](#计划配置示例)
- [支付流程](#支付流程)
- [Customer Portal](#customer-portal)
- [注意事项](#注意事项)

## 申请流程

1. **注册账号**
   - 访问 [Merchant Dashboard](https://pancake.waffo.ai/merchant/auth/signin)
   - 使用 Google、GitHub 或 Magic Link 注册

2. **获取 API 密钥**
   - Dashboard → API & Development → 复制 Merchant ID（`MER_xxx`）
   - API Keys → Create API Key
   - 选择 **Test** 环境（本地开发）或 **Production**
   - **立即下载私钥**（只显示一次）

3. **创建产品**
   - Dashboard → Products → Create Product
   - 一次性产品用于买断 / 积分包；订阅产品用于循环计费
   - 记录产品 ID（`PROD_xxx`）
   - 动态定价：写入 `pricing_plan.waffo_product_id`（管理后台或 seed）
   - 静态定价：写入 `config/payment.ts` 的 `waffoProductId`

4. **配置 Webhook**
   - Store Settings → Webhooks，或调用 API `POST /v1/actions/store/add-webhook`
   - HTTP 通道 URL：`https://yourdomain.com/api/payment/webhook/waffo`
   - 订阅事件：`order.completed`、`subscription.activated`、`subscription.payment_succeeded`、`subscription.canceling`、`subscription.uncanceled`、`subscription.canceled`、`subscription.past_due`、`refund.succeeded`
   - 验签用 RSA **公钥**（Dashboard 会显示一把）。这不是 Stripe 那种共享 `whsec_` secret；Waffo 用私钥签名，你用公钥验签。
   - `@waffo/pancake-ts` 的 `verifyWebhook()` 已内置 Test/Prod 公钥，**一般不用**拷到 `.env`。只有轮换密钥或不用 SDK 验签时才需要 `WAFFO_WEBHOOK_PUBLIC_KEY`。

## 环境变量配置

在 `.env` 文件中添加：

```env
# Waffo Pancake
WAFFO_MERCHANT_ID=MER_xxxxxxxxxx
# RSA private key (PEM). Literal \n in .env files is supported.
WAFFO_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
```

API Key 在创建时绑定 Test 或 Production，无需额外的 `TEST_MODE` 开关。

## 特性

- Merchant of Record：代处理全球税务、合规和退款
- 一次性、订阅、积分充值三种模式
- 托管结账（`checkout.waffo.ai`）
- 消费者门户（Magic Link 登录）
- 支付方式：card、Apple Pay、Google Pay、WeChat
- 一次性币种：USD、EUR、GBP、HKD、JPY、CNY
- 订阅币种：USD、EUR、GBP、HKD、JPY（不含 CNY）

## 测试模式

使用 **Test** 环境 API Key。测试卡：

| 卡号 | 场景 |
|------|------|
| `4576 7500 0000 0110` | Visa Credit 成功 |
| `2226 9000 0000 0110` | Mastercard Credit 成功 |
| `4576 7500 0000 0220` | Visa Credit 拒绝 |

任意未来有效期，任意 CVC。

## Webhook 配置

本地开发需要公网隧道：

```bash
npx ngrok http 7001
```

将 `https://<tunnel>/api/payment/webhook/waffo` 填到 Waffo Dashboard 的 HTTP webhook。

验签读取请求头 `X-Waffo-Signature`，必须使用 **raw body**。算法是 RSA-SHA256：`t.{rawBody}`。SDK `verifyWebhook()` 内置 Test / Prod 公钥；Dashboard 上的公钥是同一用途的覆盖项，不是 webhook secret。

## 计划配置示例

```typescript
monthlyWaffo: {
  provider: 'waffo',
  id: 'monthlyWaffo',
  amount: 10,
  currency: 'USD',
  duration: { months: 1, type: 'recurring' },
  waffoProductId: 'PROD_xxx',
  i18n: { /* ... */ }
}
```

静态模式改 `config/payment.ts`；动态模式改数据库 / seed。两套都应填真实 `PROD_xxx`，管理后台「从静态配置导入」会读 config。

## 支付流程

1. 用户在 `/pricing` 选择 Waffo 计划
2. `POST /api/payment/initiate` 创建本地订单
3. 服务端调用 `checkout.authenticated.create`（`buyerIdentity = userId`）
4. 跳转托管结账（当前为 `pancake.waffo.ai/.../checkout/...`）
5. 两步结账：资料 → Continue → 卡号 / Test Mode Quick Fill → Subscribe
6. Waffo 显示托管成功页，用户点 **Done** 回到 `/payment-success?provider=waffo`
7. 同时 Waffo 发送 webhook → 更新订单 / 订阅 / 积分

## Customer Portal

Waffo 提供托管消费者门户（Magic Link）：

```
https://pancake.waffo.ai/consumer/portal/login
```

仪表盘「管理订阅」会跳转到该地址。用户使用购买时的邮箱登录。

## 注意事项

- 私钥不要提交到 Git；不要在前端暴露
- 服务器时钟需要 NTP 同步（签名时间窗：落后最多 5 分钟，超前最多 1 分钟）
- 订阅与一次性产品必须在 Dashboard 分别创建
- 上线前完成 KYB，并创建 Production API Key
- TanStack Cloudflare Workers 部署已开启 `nodejs_compat`；SDK 依赖 Node crypto 签名
