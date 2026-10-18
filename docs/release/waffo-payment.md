# TinyShip — Waffo Pancake 支付接入

本版本为 TinyShip 新增 **Waffo Pancake** 作为第七个支付提供商。Waffo 采用 Merchant of Record（记录商家）模式，代为处理税务、合规和退款，提供托管结账页，适合面向全球市场的 SaaS 和数字产品。

Next.js / Nuxt.js / TanStack Start 三端同步适配，同时兼容 PostgreSQL 和 SQLite 双数据库。现有支付渠道（Stripe、PayPal、Creem、WeChat Pay、Alipay、DodoPayments）保持不变。

### 核心新增

**托管结账**：用户在定价页选择 Waffo 计划后跳转 Waffo Checkout，支持订阅、一次性买断和积分包。支付完成后从 Waffo 成功页回到 `/payment-success?provider=waffo`，订单、订阅和积分由 webhook 履约。

**支付方式与币种**：卡、Apple Pay、Google Pay、WeChat。一次性支持 USD、EUR、GBP、HKD、JPY、CNY；订阅支持 USD、EUR、GBP、HKD、JPY（不含 CNY）。

**Webhook**：`/api/payment/webhook/waffo` 处理订单完成、订阅激活 / 续费 / 取消 / 逾期等事件。验签使用 RSA 公钥（SDK 内置 Test / Prod 密钥，一般无需单独配置）。

**消费者门户**：Waffo 提供 Magic Link 登录的托管门户，用户可用购买时的邮箱管理订阅。

**管理后台**：订单与订阅列表可识别 Waffo；动态定价下可为计划填写 `waffo_product_id`。

### 数据库变更

**Schema 扩展**：订阅表新增 `waffo_order_id`，定价计划表新增 `waffo_product_id`。PG 和 SQLite 双方言 Drizzle 迁移同步到位（`0004`）。

升级时执行：

```bash
pnpm db:migrate          # PostgreSQL
pnpm db:migrate:sqlite   # SQLite / D1
```

本地若一直用 `pnpm db:push`，推一次即可。

### 配置与环境变量

```env
WAFFO_MERCHANT_ID="MER_xxx"
WAFFO_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
# 可选。SDK 已内置 Test/Prod 验签公钥，仅轮换密钥时需要
# WAFFO_WEBHOOK_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
```

API Key 在 Waffo Dashboard 创建时绑定 Test 或 Production，无需额外 `TEST_MODE`。静态定价把 `waffoProductId` 写入 `config/payment.ts`；动态定价写入 `pricing_plan.waffo_product_id`。Webhook 填 `https://yourdomain.com/api/payment/webhook/waffo`。

测试卡（Test 环境）：`4576 7500 0000 0110` 成功，`4576 7500 0000 0220` 拒绝。任意未来有效期与 CVC。

### i18n 国际化

中英文覆盖提供商名称、Waffo Order ID、管理后台定价字段。页面文案使用 i18n key，无硬编码文本。

### E2E 测试

`tests/e2e/specs/waffo-payment.spec.ts` 覆盖跳转托管结账与完整订阅支付。需 Test API Key、真实 `PROD_xxx`，以及转发到 `/api/payment/webhook/waffo` 的公网隧道。三个框架均可在 `:7001` 上跑同一套 spec。

### 文档

- **用户指南**：`docs/user-guide/payment/waffo.md` — 申请流程、环境变量、测试卡、Webhook、计划配置、支付流程
- **总览**：`docs/user-guide/payment/overview.md`、`docs/user-guide/payment-testing.md`
