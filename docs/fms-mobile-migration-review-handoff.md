# FMS 移动端迁移评审 Handoff

> 仓库：`yudao-ui-admin-uniapp-next-v4`
> 对照 PC：`yudao-hrm-all/yudao-ui-admin-vue3/src/views/fms`
> 后端：`yudao-hrm-all/ruoyi-vue-pro-jdk25/yudao-module-fms`
> 实现说明书：`docs/fms-mobile-migration-handoff.md`（本次任务的输入）
> 规范：本仓 `AGENTS.md`（优先）、实现说明书 §3 经验清单
> 文档用途：交给他人做 Code Review / 业务验收时的上下文说明

---

## 1. 一句话结论

已按 PC「FMS 财务管理」菜单把管理端主路径全部迁到 uni-app：**26 个菜单叶子、6 个分组，与数据库 `system_menu`（fms_menu.sql）的名称、顺序、权限码一一对应**；交互对齐 HRM 迁移沉淀的惯例（卡片列表、搜索弹窗、详情底部操作、`z-paging`、账套上下文 Store）。导出 / Excel 导入 / 打印刻意不做（入口提示去 PC 或直接无入口），见「已知差距」。

---

## 2. 代码状态（重要）

**全部改动未提交（no commits）**，在工作区：

- 新增未跟踪：`src/api/fms/`、`src/pages-fms/`、`src/pages-statistics/fms/`
- 修改：`vite.config.ts`（登记分包）、`src/pages/index/menu.json`（FMS 一级菜单）、`src/utils/constants/dict-enum.ts`（新增 `FMS_DICT`：科目类别/借贷方向两个字典）
- 与任务无关的既有改动（`env/.env`、`.claude/` 等）未触碰

评审范围即上述新增/修改文件。建议提交粒度：`feat(fms): ...` 按模块拆。

---

## 3. 目录与入口

| 类型 | 路径 |
|------|------|
| API | `src/api/fms/{home,voucher,ledger,report,closing,config/**}` |
| 页面 | `src/pages-fms/{voucher,ledger,report,closing,config/**}` |
| 财务首页（含图表） | `src/pages-statistics/fms/home/` |
| 账套 Store | `src/pages-fms/store/fms.ts` |
| 账套组件 | `src/pages-fms/components/account-set/{switch,guide}.vue` |
| 科目选择器 | `src/pages-fms/config/subject/components/subject-{picker,form-picker}.vue` |
| 常量/格式 | `src/pages-fms/utils/{constants,format}.ts` |
| 首页菜单 | `src/pages/index/menu.json` → 一级 **「FMS 财务管理」**（HRM 后） |

进入方式：工作台左侧点 **FMS 财务管理**。菜单叶子 `name`/顺序/权限码已按库表 `system_menu`（1052000 段）对齐，**不以实现说明书 §7 的建议名为准**（如「查凭证」非「凭证列表」、「凭证汇总表」非「凭证统计」、「核算项目明细账」非「辅助核算明细账」、「设置管理」非「基础设置」）。

**权限注意**：菜单按登录时缓存的 permissions 过滤，**改了权限必须重新登录**，否则整组消失（评审时遇到「缺分组」先退出重登，别怀疑代码）。

---

## 4. 账套上下文（FMS 特有，评审重点）

- `store/fms.ts`：`accountSet`（缓存 key `fmsAccountSet`）+ `currentMonth` + `accountSetList`；恢复顺序：缓存 → 默认 → 第一条已初始化；`isAccountSetWritable` = 成员 level 为 OWNER/WRITE。
- 每个业务页：进页 `loadAccountSetList()` → 顶部 `account-set-switch`（切换写默认账套 + 刷新期间 + emit change）→ 无可用账套显示 `account-set-guide`（按 create/initialize 权限出引导按钮）。
- 所有业务请求显式传 `accountSetId`（query/body，与 PC 一致）。
- 只读成员（READ）：隐藏 FAB/保存/审核等写操作，查询放开（`canXxx = isAccountSetWritable && hasAccessByCodes([...])` 具名 computed）。

---

## 5. 已迁移模块清单

| 分组 | 菜单 | 路径 | 备注 |
|------|------|------|------|
| 工作台 | 首页 | `/pages-statistics/fms/home/index` | 指标卡 + 趋势/结构图（yd-chart）+ 4 快捷入口 |
| 凭证管理 | 录凭证 | `/pages-fms/voucher/create/index` | 分录主子表、科目/辅助核算选择器、借贷平衡、附件图片、凭证号自动带出 |
| | 查凭证 | `/pages-fms/voucher/list/index` | 搜索弹窗、整理/移动凭证弹窗（简单表单，未引导 PC） |
| | 凭证汇总表 | `/pages-fms/voucher/statistics/index` | 期间/凭证字/号区间/级次筛选 + 合计口径对齐 PC |
| 账簿管理 | 明细账等 8 页 | `/pages-fms/ledger/**` | 查询页非 CRUD；凭证号下钻凭证详情、科目下钻明细账；行结构见 §7 |
| 报表管理 | 三张表 | `/pages-fms/report/**` | 月报/季报 + 期间范围限定启用月~当前月 |
| 结账管理 | 结账 | `/pages-fms/closing/index` | 7 项检查 + 结账/反结账；方案/模板只读 |
| 设置管理 | 科目设置 | `/pages-fms/config/subject/index` | 类型 tab + 面包屑下钻；使用情况驱动禁用 |
| | 凭证字/常用摘要/币别/财务指标 | `/pages-fms/config/**` | 标准四件套（无 `/get` 的用 list+find，代码有注释） |
| | 财务初始余额 | `/pages-fms/config/initial-balance/index` | 逐级汇总 + 试算平衡弹窗；导入按钮弹「请去 PC」 |
| | 财务参数 | `/pages-fms/config/finance-parameter/index` | 单页表单；级次只能调大 |
| | 辅助核算 | `/pages-fms/config/auxiliary/**` | 类别列表 → 项目列表两层 |
| | 账套管理 | `/pages-fms/config/account-set/**` | 列表/表单/详情/开始记账初始化/成员授权（UserPicker 加人默认查看者） |
| | 凭证模板 | `/pages-fms/config/voucher-template/**` | 分类 tab + 管理分类弹窗 + 分录编辑 |

---

## 6. 交互与实现约定（评审重点）

1. 详情 `getVoucher(id)` 等必须调 `/get`；**币别/凭证字/摘要库/凭证模板无 `/get`**，用 list+find（列表行即完整 VO，无信息损失，代码注释标明）——这是与说明书的刻意偏离，评审请确认是否接受或要求后端补 `/get`。
2. 凭证审核/删除是**批量接口**（`update-review-status`、`delete-list`），API 层保留单条便捷封装。
3. **整理/移动凭证**：判定为简单表单已做（期间+凭证字+编号），未引导 PC。
4. 后端 `@RequestParam` 的 PUT/DELETE 一律走 query（`http.put/delete(url, undefined, {...})`）——迁移中踩过「参数发 body 报参数缺失」的坑，11 处已修，新增接口请沿用此约定。
5. 明细账 `detail/subject-list` 候选接口不可用时页面降级为空态（不卡加载）。
6. 详情底部按钮在 `yd-detail-footer-actions` 内需 `class="flex-1"` 均分宽度（已全量补齐）。
7. 菜单图标名必须在 Wot 2.2.0 iconfont 内（`money` 不存在，币别用 `swap`）。

---

## 7. 已知差距（相对 PC，可接受债务）

| 领域 | 差距 |
|------|------|
| 通用 | 导出/打印/Excel 导入全不做；宽表改卡片+下钻 |
| 科目 | 辅助核算历史数据迁移（auxiliaryMappings）未做：已使用科目禁改辅助核算；无批量启停/删除、无状态开关 |
| 凭证 | 无数量/单价列编辑、科目余额显示、复制凭证、保存并新增、快捷键；列表无默认期间过滤 |
| 账簿 | 辅助明细账项目默认取类别下首个（PC 按本期有发生额筛选）；搜索科目用 yd-search-picker 而非 subject-picker（需支持非末级/停用） |
| 报表 | `/check` 平衡检查 Alert 未做；现金流量表「调整/辅助数据」编辑未做 |
| 结账 | 期间不可切换（只做当前期间）；方案编辑表单、结转损益凭证生成（`fms:closing:profit-loss`）、模板维护均只读 |
| 初始余额 | 辅助明细每类别单选生成一条组合（PC 多选笛卡尔展开）；无离开拦截 |
| 首页 | tooltip/轴 formatter 用字符串（小程序 lime-echart 限制） |

---

## 8. 后端侧两个真实问题（非前端 bug，评审请决策）

1. **`GET /fms/ledger/detail/subject-list` 需重新构建后端**：源码已有该接口，但本地 48081 运行的旧构建没有（404）。明细账候选科目依赖它；前端已做降级。
2. **年中启用账套触发 `1052104010 开始会计期间不能早于账套启用期间`**：账套启用期间 2026-08，资产负债表（内部按年初 2026-01 取数）与期末结账 overview 直接报错，**PC 同接口同参数同样报错**。建议后端把年初边界钳制到启用期间；前端未做任何规避（也未伪造数据）。

另：凭证统计/账簿/凭证详情等在同一账套同一期间均正常，可对比验证问题范围。

---

## 9. 环境与数据

- H5：`http://127.0.0.1:9000`（评审期间 dev server 可能未在跑，`pnpm dev:h5` 即可）
- 后端：`http://127.0.0.1:48081/admin-api`（**注意是实现说明书写的 48080，实际是 48081**），MySQL `127.0.0.1 ruoyi-vue-pro`
- 账号：`admin` / `admin123`，`tenant-id: 1`；库里有多个已初始化账套（上海芋道…、FMS回归测试账套…）和 3 张 2026-08 凭证
- 小程序端：`dist/dev/mp-weixin` 是旧构建，需 `pnpm dev:mp` 重新编译 + 重新登录
- 非 admin 角色注意：`system_role_menu` 里普通角色只授了「财务指标」一条 FMS 菜单

---

## 10. 建议评审路径（冒烟清单）

1. 工作台菜单：6 分组 26 叶子名称/顺序/权限（缺组先重新登录）
2. 账套管理：列表 → 详情 →（OWNER）编辑/授权/开始记账；切换账套观察各页联动
3. 录凭证：凭证号带出 → 摘要库 → 科目（含辅助核算）→ 借贷互斥/平衡 → 保存 → 详情审核/反审核/删除
4. 整理/移动凭证弹窗
5. 科目余额表（8 金额网格 + 展开/下钻）→ 明细账（需后端 rebuild）→ 总账/多栏账（凭证号下钻）
6. 报表三页：月报/季报切换（资产负债表因 §8.2 报错为已知）
7. 期末结账：检查项展示（overview 报错为已知）→ 方案/模板只读
8. 设置管理各 CRUD 页 + 初始余额试算平衡 + 凭证模板分录编辑

验证截图在 `/tmp/fms-smoke/*.png`（本机临时目录）。

---

## 11. 静态检查结果（交付时状态）

```bash
pnpm lint -- src/pages-fms/ src/api/fms/ src/pages-statistics/fms/   # 0 错误
pnpm exec vue-tsc --noEmit --skipLibCheck --pretty false              # 0 错误
git diff --check                                                      # 通过
```

## 12. 给评审人的提问清单

- [ ] 币别/凭证字/摘要库/凭证模板 list+find 是否接受，还是后端补 `/get`？
- [ ] §8.2 年中启用账套的年初取数报错，是否安排后端修？
- [ ] 结账方案/模板编辑、结转凭证生成是否排二期？
- [ ] 凭证列表是否需要默认按当前期间过滤（PC 有，移动端暂无）？
- [ ] 整理/移动凭证的简单表单形态是否满足业务？

---

## 13. 不在本次范围

- 未改后端、未改 PC、未提交 git
- 凭证整理大表格预览、地图选点、公式可视化编辑不做
- ERP `pages-erp/finance/*`（进销存收付款）与 FMS 无关，未动

文档生成说明：基于迁移会话整理，所有接口路径/权限码均核对过后端 Controller，菜单已核对 `system_menu`；不替代逐文件 CR。
