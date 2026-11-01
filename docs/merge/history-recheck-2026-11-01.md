# unibest 历史遗漏复核与跟进（2026-11-01）

## 结论与状态

按用户要求交给 **Opus 5.5 local / high** 分析，主代理独立核对关键补丁、当前源码和台账。确认 **1 项此前部分采用时漏评的依赖清理**，另有 **1 项已忽略的支付宝适配可按需求复议**；本轮没有确认必须立即补入的新核心运行时特性。

经用户授权“评审后跟进”，A 由 **Opus 5.5 local / high** 完成依赖清理，主代理统一测试并组织三轮 review-agent 评审；最终五位必需评审均通过。B 继续暂缓。**本批经用户确认纳入本地提交，暂不推送**；未新增仓库单测或测试基础设施，未改变 tabbar、业务源码或 AppID，原有暂存及其他未提交改动保持不变。

| 原始月份 | 上游提交 | 价值与分类 | 本地结论 | 后续批次 |
| --- | --- | --- | --- | --- |
| 2026-05 | [`1c1c7bd31c9b3bf16285452a02d593a34d6c6d0f`](https://github.com/uni-run/unibest/commit/1c1c7bd31c9b3bf16285452a02d593a34d6c6d0f) | 中；部分采用中的遗漏子项 | A 已完成冗余直接依赖清理、测试及评审；不是已复现的安装故障修复。 | 2026-05 补录，纳入本地提交；HBX 资源导出按用户要求跳过。 |
| 2025-11 | [`c30707650ad626363b47577b839dbdf62352a329`](https://github.com/uni-run/unibest/commit/c30707650ad626363b47577b839dbdf62352a329) | 低；已忽略项的条件性复议 | 支付宝 `customize` 与对应组件适配，先复现真实问题，再决定是否采用。 | 若需要交付该能力，按 2025-11 补录专项处理。 |

## 范围与提交图口径

- 复核基线 HEAD：`48331ce0776e717a960f0d8bb3ec4c17be6d7c69`。
- 上游 `main`：`3e2a714b3c21feda8080460977b5185afa3f6bae`；`base`：`b4c729619fadd06260863845a8cb07d06be8d054`。其余 5 个分支完整边界沿用[六月快照](./2026-06.md)，本轮刷新后均未变化。
- 7 个分支可达提交合计 2,976 个，其中非合并提交 1,887 个，作者月份从 2023-12 到 2026-06。扫描提交标题及改动路径，不把 1,887 个提交表述为全部逐行审阅。
- Opus 在运行时 / 构建路径中筛选候选，首轮自报约 20 个读取完整 diff、约 45 个进行本地行为对照；这是分析者的深读量估算，不是逐提交覆盖证明。CLI、模板示例、国际化分支等并未逐个深读。
- `main` / `base` 并集有 1,557 个非合并提交。相对当前 HEAD，`main` 有 137 个、`base` 有 81 个非合并提交不在祖先集合中；去重后的并集为 150 个。含合并节点的单分支差集分别为 206、125 个。这里的“尚非祖先”不能直接等同于“尚未同步”，部分能力已经移植。

共同祖先 `4f51d06c8f159c3fb20a4a2d5e5f334fa1b6f0cf` 的作者时间为 2025-12-02，不能据此排除所有日期更早的提交。真实拓扑差集中，作者日期为 2025-12-02 及以前的仍有 `9384c277`、`c3070765`、`5eab05b9`、`74c6ea7c`、`a5184e3c` 五个；分别涉及 token、支付宝、CI、国际化依赖和 CI。token 已覆盖，支付宝列为条件性复议，其他项无新增采用建议。

Opus 首版的 49 / 21 计数无法准确复现筛选条件，连同“其中 43 个已在台账出现”的说法一起撤回；“共同祖先日期之前全部已包含”的推断也不采用。主代理要求同一会话按真实差集补查，Opus 已逐个读取上述五项的完整 diff，确认没有新增候选。报告采用修正后的拓扑口径及有源码证据的结论。

## 2026-05：移除 Darwin 专用直接依赖

上游 `1c1c7bd3` 同时修改 tabbar 与依赖。本地[五月台账](./2026-05.md)只登记了 tabbar 的异步同步、可见性恢复和点击后同步，没有为依赖删除部分给出采用 / 暂缓 / 忽略结论，因此是遗漏子项。

实施前 [package.json](../../package.json) 的 `devDependencies` 直接声明：

- `@esbuild/darwin-arm64: 0.20.2`
- `@esbuild/darwin-x64: 0.20.2`
- `@rollup/rollup-darwin-x64: ^4.28.0`

[pnpm-lock.yaml](../../pnpm-lock.yaml) 原根 importer 也有这三项。当前已移除三项直接声明和对应 importer，三个保留快照标记为 `optional: true`，继续保留 esbuild / Rollup 的传递平台包。生产差异仅两个文件，合计 +6 / -15 行；全部 2,091 个 package 记录、2,147 个 snapshot 键、版本、optional 依赖边、设置和其他 importer 内容均由整体结构断言确认不变。现存部分 Darwin 记录缺少 CPU 条件，本轮没有顺手修正。

锁文件处理方式已向评审明确披露：主代理用项目固定 pnpm 10.10.0 在隔离副本生成候选，整份重生成额外带来根 `@types/node` 从 20.19.11 到 20.19.20、23 处 peer 键和 39 处平台元数据变化，因此未整份采用。Opus 仅纳入工具生成的三项 importer 删除和三个 optional 快照变更，保留其余原始锁图；不是整份重新规范化后的锁文件，也没有升级依赖。未改 manifest 的原始基线执行普通 lock-only 安装后锁文件字节不变，不能说每次普通安装都会产生上述额外变更。

验证使用 Node 20.20.2 / pnpm 10.10.0，在隔离副本完成：

| 检查 | 结果与边界 |
| --- | --- |
| macOS ARM64、Linux ARM64/glibc 修改前后 frozen 安装，统一 `--ignore-scripts` | 均通过；原始版本在 Linux 也能安装，没有复现平台安装失败。 |
| 两个平台修改前后的 esbuild 二进制/转换、Rollup 原生模块/打包 | 均通过；Linux 安装树中额外 Darwin 二进制由 3 个降为 0 个，原合计约 21.8 MB。 |
| macOS 额外一次正常 frozen 安装，启用生命周期 | 通过；不将成对 `--ignore-scripts` 对照当作生命周期验收，也不据此断言 pnpm 10.10 的 `allowBuilds` 语义。 |
| `pnpm lint -- package.json`、全量 `pnpm exec vue-tsc --noEmit --skipLibCheck --pretty false` | 均通过。 |
| `pnpm build:h5`、`pnpm build:mp:prod`、`pnpm build:app` | 均退出 0；分别约 242 / 301 / 159 秒，同一最终 manifest/lock 哈希。 |
| 实际 HBuilderX 4.85 捆绑 Node 18.20.0 / darwin / x64 | 在 Apple Silicon Mac 上通过候选 esbuild x64 二进制/转换及 Rollup x64 原生模块/打包测试。 |
| HBuilderX 本地 App 资源导出 | 登录后因 AppID 成员权限在编译前停止；用户对测试 AppID 请求回复“这个先忽略；不用这个哈”，本轮跳过，保留未验证记录。 |

HBuilderX 测试副本在 Node 20.20.2 环境用 `pnpm install --frozen-lockfile --ignore-scripts --offline --reporter append-only` 创建，退出 0，约 9.4 秒；随后由 `/Applications/HBuilderX.app/Contents/HBuilderX/plugins/node/node` 执行本地 `native-smoke.cjs`。这是原生依赖加载检查，不是用 Node 18 完成整个项目构建，也不是 HBX 资源导出通过。Linux 首次 Docker 安装中断后原 manifest 重试成功；重试基线使用部分已链接树，候选使用新树，安装耗时不可用于性能比较。

原始固定来自 [`599e1283`](https://github.com/uni-run/unibest/commit/599e1283adc541914162021498aac3a108df1c6c) 的 M 芯片 HBuilderX App 打包兼容处理。当前文档仍支持 HBuilderX，README 的 CLI 描述不能据此缩减 App 支持。当前锁文件保留双 Darwin 架构安装，已实测覆盖本机 HBX x64 原生依赖；**以后重新生成锁文件、恢复 CPU 约束或调整架构安装策略时，必须重新验证 Apple Silicon + HBX x64 的依赖加载和 App 发布路径**。若届时缺失 x64 包，单独评估 `supportedArchitectures` / `--cpu` 策略或恢复必要固定，不在本轮预设策略。

本轮收益是冗余依赖清理，不宣称修复了已复现的 Linux / Windows 安装故障。HBuilderX 资源导出、APK/IPA、签名和真机未通过验收，也未云打包或发布；其他 Intel Mac、其他 HBX 版本、Windows、Linux x64/musl 未验证。CLI App 编译与原生打包的区别参见 [DCloud CLI 文档](https://uniapp.dcloud.net.cn/worktile/CLI.html)。本项不改变五月已完成的 tabbar 行为。

## 2025-11：支付宝自定义 tabbar 复议

`c3070765` 在上游 [src/tabbar/config.ts](../../src/tabbar/config.ts) 对应的 `_tabbar` 增加条件编译配置 `customize: !!needHideNativeTabbar`，还增加 `src/customize-tab-bar/index.axml` / `index.js` 两个组件文件。该组件写死上游 demo 路由，不能照搬到当前权限 tabbar。

本地 `_tabbar` 没有 `customize`，但 [src/tabbar/index.vue](../../src/tabbar/index.vue) 已有支付宝 `onMounted -> hideTabBar`，因此不能仅凭缺少一个配置字段断言已存在双 tabbar 或安全区缺陷。应在开发者工具 / 真机复现后，连同支付宝对应组件一起设计适配，保留芋道的可见项、权限和索引语义。

源码只能证明调用了 `hideTabBar`，不能证明隐藏成功、无闪烁或安全区正确。复议时需覆盖当前 SDK、缓存策略 2、权限过滤后的 tab、带底部指示条的设备，检查底部 inset、页面高度、遮挡、原生栏闪现、switchTab 成败、选中同步和权限变化；复现缺陷后再核对生成 app.json 的 customize/custom、组件复制和类型契约，明确原生 / Vue tabbar 的唯一归属。该提交的组件目录实际只有 index.axml、index.js 两个文件，完整补丁没有截断；也不据此认定未来生产适配只需照搬这两个 demo 文件。

[二月台账](./2026-02.md)已用合并节点 `f6f4e5b` 登记“支付宝自定义 tabbar、snippets 和 demo 页调整，当前不需要”。这次是复议建议，不是新发现的漏评；四月已有支付宝构建通过记录，但构建通过不等于该运行时表现已经验收。没有实际问题时，继续维持忽略。

## 已覆盖与不采用的重点候选

| 历史提交 / 能力 | 当前证据与结论 |
| --- | --- |
| `9384c277`：token 响应式时间戳 | `src/store/token.ts` 的 `updateNowTime()` 及 HTTP、路由调用已覆盖；不因上游 SHA 不在 HEAD 就重复同步。 |
| `97f8c8e7`：版本字段正则 | `scripts/bump-version.js` 已支持带引号字段，当前 manifest 可用。 |
| `6b899c71`：删除默认 JSON Content-Type | `src/http/interceptor.ts` 已仅展开原 header，避免影响 uploadFile。 |
| `7e58ff1b`：Windows unconfig 覆盖 | `package.json` 已有 overrides / resolutions，不重复引入。 |
| `a7b5a800`：避免重复跳登录 | `src/utils/toLoginPage.ts` 已防抖、识别当前登录页，并保留芋道 reLaunch 回跳定制。 |
| `810fe433`：App Pinia 激活 | `src/store/index.ts` 已调用 `setActivePinia(store)`。 |
| `1dccf1ef` / `49d166a3`：支付宝 globalObjectMode | `manifest.config.ts` 已包含对应配置。 |
| `51414d90` / `14594dad`：支付宝隐藏原生 tabbar | `src/tabbar/index.vue` 已有处理；与尚待复议的 `customize` 分开判断。 |
| `d24baa10`、`bc8528ff`：插件与 H5 根路由 | `src/router/interceptor.ts` 已处理 `plugin://`、`/`。 |
| `72102800` / `a8ec7f7b`：旧版请求取消 | 当前普通 HTTP / useRequest 不对外提供旧版 requestTask 返回结构，上游后续也改写了该契约；不搬旧返回结构。其他上传 / SSE 等任务的 abort 不能据此认定已穷举。 |
| `5b80df6b`：i18n 分包标题查找 | 当前 `getCurrentPageI18nKey` 没有调用方，无直接收益；国际化运行时需作为独立产品需求评估。 |
| `a4c19a3` / `05e03c0`、`95c9628` / `76ea645` | 引入后又撤回的 pages-json / devtools 变动按最终净效果判断，不重新恢复已撤回能力。 |

## 保留项与验证边界

完整 HttpError、TabbarItem 拆分、H5 `$router.beforeEach`、uni-pages 升级和直接覆盖上游锁文件等维持原决定。`70767b49` 的抖音 uni-env 补丁仍暂不采用；[二月记录](./2026-02.md)已包含 `build:mp-toutiao` 通过且未复现问题的结果，不能将其写成从未做过验证。本轮没有对该历史结果重复验收，也没有新增复现证据。

历史筛选主要依赖静态源码与提交图分析。更早的祖先提交、其他模板分支、CLI 与 demo 没有逐个完整 diff 审阅，因此不声称整个上游历史绝无遗漏。A 的工程验证范围见上表；支付宝真机、后端和页面端到端未验证，B 不记为已修复。

## 评审与交付记录

使用 review-code-with-agents，同一审计和原会话完成 Discovery → Closure → Closure。首轮主代理采纳锁图验收、历史 HBX 动机、支付宝复现/归属、基线/生命周期四项建议（置信度分别 9 / 9 / 9 / 8）；“支付宝补丁截断”以完整 Git hunk 和目录清单核对后拒绝（2）。第二轮 Qwen 指出不能用 README 取消 HBX 支持，主代理确认后补实际捆绑 x64 Node 测试，并按用户指示记录导出未验证范围。此前 Qwen 漏读 package.json，未将其原自报 FULL 当作有效全覆盖；第三轮原生读取补齐，本轮七份材料 620/620 行内容匹配。

最终 Codex（gpt-6.1-sol / xhigh）、GLM-5.3 / high、Opus 5.5 local / high、Qwen3.8-Flash / high、DeepSeek V4.1 Flash / high 均 APPROVED，所有 Active 项已关闭。Claude 的路由模型由本地服务报告，未独立验证上游模型身份；Qwen 配置为 CLI 接受，DeepSeek 为请求值。可选旁路不作为必需评审覆盖，MiMo 第三轮返回通过，其余受不可用、配额或未完整返回限制。

交付范围仅 package.json、pnpm-lock.yaml 和三份台账 Markdown。测试探针、脱敏日志、分析及评审证据仅本地保存；评审快照归档后清理本任务闲置副本，其他任务工作树、全局依赖缓存及原有暂存不动。月度归属继续为 2026-05 / 2025-11，不新增虚构的十一月上游批次；本批经用户确认纳入本地提交，暂不推送。
