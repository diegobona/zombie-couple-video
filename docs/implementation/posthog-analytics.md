# PostHog AI 来源统计

仅用于 TanStack Start 的 `https://zombie-couple-video.net`。沿用 Rumpelstiltskin 的官方 `posthog-js/no-external` 接入方式。免费组织仅一个项目，因此复用现有项目（ID `666244`）及公开 Token，以 Host 域名筛选区分网站。

## 配置

Vite 的 `envDir` 是仓库根目录，因此公开配置必须放在根目录 `.env.production`：`VITE_POSTHOG_PROJECT_TOKEN` 和 `VITE_POSTHOG_HOST=https://us.i.posthog.com`。示例见 `apps/tanstack-app/.env.analytics.example`。Project Token 是公开上报 Token，不能使用个人 API Key。空 Token 关闭上报；修改后重新构建并部署。现有服务端密钥仍保留在原来的本地文件和 Worker secrets。

入口为 `src/components/site-analytics.tsx`，hydration 后初始化一次，`src/lib/analytics.ts` 仅在生产 origin 加载 SDK。localhost 和预览域名不发送统计。主页仍由服务器渲染。

## 查看人数

打开 [Web Analytics](https://us.posthog.com/project/666244/web)，添加事件属性筛选 **Host (`$host`) = `zombie-couple-video.net`**，再选 **Channels → AI**，选择日期范围，查看 **Visitors**。查看 Rumpelstiltskin 时把 Host 改为 `rumpelstiltskin-ai.co`。没有域名筛选时显示两站合计，不能当作单站数据。

Referrers 可进一步区分 ChatGPT、Claude、Perplexity 等来源。PostHog 使用已知 referrer 和 UTM 归类 AI 渠道，无需自行把所有访问标为 AI。两站共用项目免费额度；不新建项目、不更改套餐或添加银行卡。浏览器 localStorage 按 origin 隔离，两站匿名访客标识独立。

只有页面加载产生 `$pageview`。匿名浏览器标识用于估算去重访客数，未与应用内部访客 ID 关联。不采集点击、生成、上传、下载等操作，不启用 session replay、person profiles、surveys、feature flags 或 performance capture。

页面 URL 仅保留归因参数 `utm_source`、`utm_medium`、`utm_campaign`、`utm_content`、`utm_term`、`ref`、`source`，删除其他查询参数和 hash；referrer 仅保留 origin。照片、文件名、故事文本、生成媒体链接不进入统计属性。公开隐私政策已描述上述处理及美国区域。

无法携带来源的 AI 访问会归为 Direct/Unknown；浏览器拦截和网络失败也可能漏记。Visitors 是浏览器估算值，清理存储或换设备可能重复计数。

## 验证

相关 Playwright 测试使用真实 SDK，拦截生产 origin 到本地预览，并拦截 PostHog 上报。模拟 AI referrer 仅限本地测试，不写入线上。检查来源和 UTM、稳定匿名 ID、URL 清理、只有基础访问事件、localhost 排除及隐私文案；不生成视频。

2026-10-15 验证通过：TanStack typecheck、Cloudflare production build、deploy dry run、2/2 相关 E2E、Cloudflare 本地预览主页和隐私页检查。`agent-browser` 未安装，浏览器验收使用 Playwright + Edge。构建使用仓库指定 pnpm 9.4.0；全局 pnpm 11 与现有依赖布局不兼容，未迁移工作区依赖格式。构建仍提示既有的 chunk >500 kB 和 Wrangler `secrets` 实验字段警告。

生产版本：`f0bf3912-312e-4048-9caa-c0dbf5184500`。`scripts/manual/posthog-production-smoke.mjs` 验证线上首页/隐私页 HTTP 200、SSR H1、无页面错误，PostHog `/e/` 返回 HTTP 200 / `{"status":"Ok"}`。本次检查只产生一次普通 Direct 访问。证据保存在 `test-results/posthog-production-smoke.json` 及 `posthog-{typecheck,build,e2e,dry-run,deploy}.log`。

参考：[PostHog TanStack Start](https://posthog.com/docs/libraries/tanstack-start)、[SDK 配置](https://posthog.com/docs/libraries/js/config)、[Web Analytics 渠道](https://posthog.com/docs/web-analytics/dashboard)、[项目和 Host 筛选](https://posthog.com/docs/settings/projects)。
