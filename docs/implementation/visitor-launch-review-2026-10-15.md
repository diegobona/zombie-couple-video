# 访客视角上线前检查 — 2026-10-15

后续进展：网站已于 2026-10-15 部署，生产数据库、密钥、域名/HTTPS、匿名会话、图片上传和正式页面检查已通过，详见 [生产部署记录](./cloudflare-production-deployment.md)。本次仍未额外执行付费生成，真实成片验收尚未覆盖。

以下为部署前的历史检查与页面快照；其中数据库占位、域名未部署和旧文案待办已由后续工作更新。原检查只覆盖 TanStack 产品，未扩充 SEO 内页、发送邮件或提交新的视频任务。

## 页面与链接

| 页面 | HTTP | 桌面链接数 | 手机横向溢出 | 处理 |
|---|---|---|---|---|
| / | 200 | 7 | 无 | 文案逐段核对、链接逐个点击 |
| /privacy-policy | 200 | 6 | 无 | 文案逐段核对、链接逐个点击 |
| /terms-of-service | 200 | 6 | 无 | 文案逐段核对、链接逐个点击 |

桌面 1440×1000、手机 390×844 各点击 19 个页面链接，共 38 次。所有站内链接到达目标页，页眉/页脚均可返回首页。mailto 已点击并拦截系统处理，只核对邮箱，不发送邮件。两端没有页面脚本异常或非预期 HTTP 错误。原有两个内容 URL 的 301 跳转、robots/sitemap、单 H1/canonical、无 JS 正文和 404 返回首页也已覆盖。

## 已修正

1. 损坏图片：原来只检查 MIME/扩展名，伪 PNG 会显示破图。现增加浏览器实际解码验证，校验完成前禁用提交；不合格图片不进入预览或上传。保留原有格式/10 MB 限制。
2. 免费说明：表单提前说明当前每个浏览器成功生成一次；已用完状态不再暗示一定存在可下载视频。FAQ、条款与中英文资源保持一致，成片不满意仍计成功已说明。
3. 照片处理：上传区提前提示公开链接可访问，生成前提供条款/隐私入口，页脚新增客服链接。隐私政策明确可编辑故事也会发送处理，删除新站无关的旧账户残留文案；条款明确两位成年人。运营名称 ColdStone co. 与客服 zw83716@gmail.com 已由用户确认。
4. 无 JavaScript：增加明确启用说明；正文仍由 SSR 提供。
5. 丢失提交响应：旧版本已复现「后台任务存在，前台错误并锁死」。现刷新服务器任务状态、恢复任务 ID，用 Try again 查询已有任务，避免重复生成 POST。
6. 正式配置：APP_BASE_URL/BETTER_AUTH_URL 改为正式域名，R2_PUBLIC_URL 写入公开变量，保留本地预览显式 localhost 覆盖。补全必要密钥声明和监控 traces；本地示例移除无关 PG/支付/联盟配置。部署命令先检查生产配置，数据库占位 ID 会明确阻止发布。

## 验证

- TanStack typecheck 与 Cloudflare build：最终版本均通过（退出码 0）。
- 桌面/手机 E2E：最终 22/22 通过，包含丢失提交响应回归；该回归在旧构建上已复现失败，修复后两端通过。覆盖所有故事按钮、500 字符上限、照片更换/删除、损坏/不支持/超限图片、两次上传、授权、成功/失败/已用完、上传重试、下载重试、恢复和刷新。视频响应均模拟，不代表实际供应商成片验证。
- 真实本地 API：{"trialStatus":200,"anonymousStatus":200,"uploads":[{"status":200,"publicHead":200},{"status":200,"publicHead":200}],"invalidStoryStatus":400,"balanceUnchanged":true,"trialState":"available","providerGenerationCalls":0}。两张现有虚构测试人像用于上传验证，未生成新素材；照片链接 HEAD 200。
- Worker runtime 类型生成成功；原有 home.css 保持不变。
- 构建仍有既有大 JS chunk、混合导入提示；Wrangler 提示 required secrets 配置字段为实验性，当前安装版本支持并已通过本地构建。
- 本轮未重复跑 Lighthouse；上一次为本地 SEO 100 / Performance 92 / LCP 2.7 秒，不作为正式域名速度保证。

## 正式开放前尚未完成

1. 生产 D1 仍是全零占位 ID，未建库/迁移验证；`check:production` 当前按预期失败并阻止默认部署命令。
2. 尚未确认 Worker 生产密钥、AutoDL 余额/权限。不能以本地密钥可用推断线上可用。[Cloudflare 密钥说明](https://developers.cloudflare.com/workers/configuration/secrets/)。
3. 尚未部署或验收正式域名 DNS、HTTPS、www 重定向、正式 Origin 的匿名会话和上传。
4. 生产环境完整真实生成→刷新恢复→播放→下载及人物一致性未验收。之前试片曾出现人物身份漂移，不能仅凭模拟测试宣布成片质量合格。本轮遵守不额外生成演示视频的约定。
5. 演示素材已在后续步骤按用户要求改用对标站的三段情侣参考视频，已启用并验证播放，详见 `reference-demos-2026-10-15.md`。它们不作为本站真实生成质量的验收证据。
6. 法律文案核对的是与实际产品行为的一致性，不代表法律合规认证；邮箱未发送测试邮件。

## 当前页面实际文案快照

### /

Title: Zombie Couple Video: AI Love Stories from Two Photos

Description: Create a zombie couple video from two photos. Choose a story, edit your prompt, then preview and download a 10-second clip. No login; free for a limited time.

Canonical: https://zombie-couple-video.net/

Zombie Couple Video

No login required
Free for a limited time

Add a photo of each of you and choose your story.

Survivor photo · required
Choose survivor photo

One adult per photo, with a clear face and even lighting. JPG, PNG or WebP, up to 10 MB.

Zombie partner photo · required

Add your partner’s portrait

Choose partner photo

Upload a normal portrait of your partner. The AI adds the zombie appearance.

Uploaded photos use public links for video processing. Anyone with a photo link can view it. Only upload photos you are comfortable sharing this way.

Choose your story

Each story is a text prompt. You can edit it below.

Ruins Reunion
Rainy Reunion
Snowbound Reunion
Your story

Choose a story above, or write your own.

169 / 500
Both people are adults, and I have permission to use these photos and depict them in this fictional story.

By generating, you agree to the Terms of Service and acknowledge the Privacy Policy.

Generate video

One successful video per browser under the current free offer. No login or payment required.

Generation can take a few minutes. Keep this page open until your video appears.

Your zombie love story

Your finished video will appear here.

Add both portraits and choose a story to get started.

A 10-second portrait video guided by your photos and story. Faces, movements and scene transitions can vary.

Download video

Save your video when it is ready. Provider download links are temporary.

Create a zombie couple video from a photo of each of you. Choose who stays human and who becomes the zombie partner, select a story or write your own, then preview and download your result. No login is required, and generation is free for a limited time.

A zombie couple video tells a reunion through recognition, a gentle gesture and a memory of life before the outbreak. The two portraits guide the characters, while your words describe what happens between them. You do not need a reference clip or a finished zombie photograph. Start with a normal portrait for each person, choose a setting you like, and keep the emotion clear enough to follow in a short vertical scene.

How to Make a Zombie Couple Video
1
Upload two portraits

Photo 1 stays human. Photo 2 becomes the zombie partner. Use clear adult portraits with permission.

2
Choose your story

Pick one of three stories. Edit the text to change the setting, gesture or happy memory.

3
Generate your video

Confirm photo permission and select Generate video. Generation can take a few minutes.

4
Preview and download

Watch the finished video, check both characters and save it while the download link is available.

Choose a Story for Your Zombie Couple Video

These three starting points are editable text prompts. Each suggests a setting, a reunion and a happy memory for your zombie couple video. Choosing one fills the story box above; it does not select a prerecorded clip or guarantee matching camera movements. Keep the parts you like and change the details that matter to you.

Ruins Reunion

In a ruined city, I recognize my partner who has turned into a zombie. I lower my gun and we embrace. The scene shifts to a warm memory of us hugging in a summer meadow.

Choose this zombie couple video story for a ruined city and a bright outdoor memory. You can change the meadow to a familiar park or replace the embrace with holding hands. Keep the recognition before the memory so the emotional change is easy to follow.

Rainy Reunion

On a rainy street at night, my zombie partner approaches. I recognize their face, lower my gun and reach out to embrace them. The scene shifts to a sunny memory of us holding hands by the sea.

Choose this zombie couple video story for a quiet reunion in the rain. The sunny seaside memory gives the ending a warmer mood. You can describe a different remembered place, but asking for several locations in one short scene may make the transition less clear.

Snowbound Reunion

Outside a cabin on a snowy night, I recognize my zombie partner returning home. I lower my gun, gently touch their cheek and embrace them. The scene shifts to a warm memory of us cuddling beside the fireplace.

Choose this zombie couple video story for a return home on a snowy night. The cabin and fireplace connect the reunion with a shared memory indoors. Use one simple affectionate gesture; adding several movements can make hands, faces and body contact harder to keep consistent.

Photo and Prompt Tips for a Zombie Couple Video
Choose clear photos

For a zombie couple video, use separate portraits with one adult in each. Keep the face visible and avoid sunglasses, strong filters and distant subjects. Photo 1 stays human; photo 2 becomes the zombie partner. Similar lighting and a comparable crop give the model clearer references than two very different pictures. Use a normal portrait for your partner, because the story requests the transformation. Check the two previews before starting so the roles are assigned as you intended.

Keep the story focused

A zombie couple video prompt works best as a short sequence you can picture: recognize your partner, make one affectionate gesture, then recall a happier moment. The story field allows up to 500 characters. Write actions and feelings rather than a list of camera instructions. If you replace a preset, keep both uploaded people in the same roles and describe one main setting. A short clip may simplify movements, alter the transition or omit details when the request contains too many events.

Review your result

Preview your zombie couple video before sharing. Check both identities, the zombie appearance, contact between hands and bodies, the transition and any audio. AI can change a face or introduce visual mistakes even when the reference photos are clear. A result is an interpretation of your story, rather than an exact reconstruction of a memory. Download the MP4 when it is ready, because provider links are temporary. If a connection is interrupted, use the retry control to check the existing task before starting again.

What You Get
Inputs
Two adult portraits and an editable story
Length
10-second generation setting
Format
Portrait MP4
Resolution
768p portrait setting; final dimensions depend on the provider
Sound
Generated audio may be included; no particular soundtrack is promised
Price
Free for a limited time, with no login required
Zombie Couple Video FAQ
What is a zombie couple video?

It is a fictional AI love story: a survivor recognizes their partner after a zombie transformation, chooses an embrace and remembers a happier moment together.

Can I write my own story?

Yes. Choose a preset to get started, then edit or replace its text. Keep it to a few clear actions for a short video. The two uploaded photos keep their survivor and zombie-partner roles.

Do I need to log in or pay?

No login or payment is required under the current limited-time free offer. It includes one successful video per browser, with no subscription. A completed video uses the free opportunity even if the result differs from your expectations.

Which photos work best?

Use one clear photo of each adult, with visible eyes, even lighting and minimal filters. Upload a normal portrait for the zombie partner; zombie styling is added during generation.

What happens if generation fails?

A confirmed generation failure restores the free generation opportunity. A connection problem does not always mean the task failed; use Try again to retrieve a running task.

How are my photos handled?

Photos upload when you start generation. Cloudflare R2 stores them, and AutoDL receives publicly accessible image URLs to generate the video. There is no automatic deletion schedule; contact zw83716@gmail.com for deletion requests.

### /privacy-policy

Title: Privacy Policy | Zombie Couple Video

Description: How ColdStone co. handles visitor sessions, uploaded photos and video generation data for Zombie Couple Video.

Canonical: https://zombie-couple-video.net/privacy-policy

Privacy Policy

Last updated: October 15, 2026

ColdStone co. operates Zombie Couple Video. This policy describes the information used for visitor sessions and photo-to-video generation.

Information used by the service

The service creates an anonymous session with a generated internal identifier to associate uploads and video tasks with your browser. Registration, a name, an email address and a password are not required. Session records can include your IP address and browser information.

When you generate a video, the service processes the photos you select, your editable story text, the prepared generation instructions, job status and a link to the resulting video. Support emails contain the information you choose to send us.

Why we use this information

Visitor sessions protect access to uploads and video tasks. Internal credit records track generation usage and failure recovery. Uploaded photos and generation instructions are needed to create your requested video. Technical logs help diagnose errors and protect the service from misuse.

We use information sent to the support address to respond to your request. Avoid including passwords, API keys or unnecessary personal information in your message.

Storage and video processing

Cloudflare provides the application hosting, D1 visitor and task database, and R2 photo storage. AutoDL receives the reference-image URLs and generation instructions to run the video workflow. These providers process data on their own infrastructure and may process it outside your country.

Uploaded reference photos currently use public storage URLs so the video provider can retrieve them. Anyone who has such a URL can access the image. Do not upload confidential documents or images you need to keep private. A local preview alone does not upload a photo; the upload begins when you start generation.

Retention and deletion requests

There is currently no automatic deletion schedule for uploaded photos. Visitor, task and internal credit records remain until removed through administration or a supported deletion process. Generated-video links supplied by the provider can expire, so download the result while it is available.

To request access, correction or deletion, email us and describe the records or uploads involved. Include the approximate generation time and any task or image URL you retained. We may need information to verify the request. Deleting an application record does not necessarily remove provider-retained copies.

Cookies and analytics

The service uses a signed, HttpOnly visitor cookie for session continuity and misuse prevention. This cookie can last up to one year. We also use short-lived, keyed hashes of Cloudflare-provided IP addresses to limit request bursts; the trial rate counters do not store raw IP addresses.

The authentication system uses session cookies, and the interface may store your theme preference in the browser. The current tab also keeps your latest video task ID for up to 24 hours; photos are not stored in this browser record.

PostHog basic page-load and referral analytics was enabled later on October 15, 2026. The live privacy policy now describes its anonymous browser identifiers, attribution data and US hosting. See [the current analytics implementation](./posthog-analytics.md) and `apps/tanstack-app/src/lib/legal-copy.ts` for the full updated wording.

Contact

For support, privacy requests or questions about these terms, email zw83716@gmail.com. ColdStone co.

### /terms-of-service

Title: Terms of Service | Zombie Couple Video

Description: Terms for using the Zombie Couple Video photo-to-video tool operated by ColdStone co., including uploads, free trials and generated results.

Canonical: https://zombie-couple-video.net/terms-of-service

Terms of Service

Last updated: October 15, 2026

These terms cover your use of Zombie Couple Video, operated by ColdStone co. Please read them before uploading photos or starting a generation.

The service

The tool creates a new video from character photos and an editable zombie couple story. It uses an AI generation provider. Faces, motion and shot timing can vary; a particular likeness, exact actions or completion time is not guaranteed.

Zombie Couple Video is an independent tool. It is not affiliated with the creators of other zombie couple videos or any film.

Your browser session and photos

Keep cookies enabled while using the maker so it can associate your uploads and video tasks with the same browser session. You are responsible for the photos and generation requests you submit.

Both people shown must be adults. Upload only photos you have permission to use, including the permission needed to depict identifiable people. Do not use the tool to harass people, commit fraud or create unlawful content. We may restrict access when the service is misused.

Permission to process uploads

You keep any rights you already hold in your uploads. By starting generation, you allow us and the service providers to store and process those uploads to produce and deliver the requested video.

You are responsible for checking whether your intended use of an output respects other people’s rights. The service does not guarantee that an AI output is unique or that it grants exclusive rights in the result.

Free trial and generation

Video generation is free for a limited time, without registration or payment. The current offer includes one successful video per browser, tracked through visitor and session cookies. Availability is subject to service limits.

When the provider reports a failed generation and the internal refund completes, the free opportunity is restored. Contact support if it remains unavailable after a failure. A completed video that differs from your expectations still counts as a successful generation. Short-term network limits may temporarily delay retries.

Any future paid offer must show its price and applicable purchase terms before payment. These terms do not establish an unannounced subscription or automatic renewal.

Availability and downloads

Generation can take a few minutes. Keep the tool open while a job runs, preview the result, and download the MP4 to your device. The application does not currently provide a permanent video library.

Temporary links and unfinished job status can become unavailable. Contact support with the approximate generation time and any task reference you retained if you need help with an interrupted job.

Changes and applicable rights

We may update the tool and these terms. The date on this page identifies the current version. Nothing in these terms is intended to remove rights that applicable law does not allow us to exclude.

Contact

For support, privacy requests or questions about these terms, email zw83716@gmail.com. ColdStone co.

