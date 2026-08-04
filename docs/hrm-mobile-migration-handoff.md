# HRM 移动端迁移评审 Handoff

> 仓库：`yudao-ui-admin-uniapp-next-v4`  
> 对照 PC：`yudao-hrm-all/yudao-ui-admin-vue3`  
> 后端：`yudao-hrm-all/ruoyi-vue-pro-jdk25`  
> 规范：本仓 `AGENTS.md`（优先）、PC `AGENTS.md` / HRM 专项决策  
> 文档用途：交给他人做 Code Review / 业务验收时的上下文说明  

---

## 1. 一句话结论

已按 PC「人力资源 / HRM 员工端」菜单将管理端与员工端主路径迁到 uni-app 移动端；交互对齐 CRM / 现有 admin uniapp 惯例（卡片列表、详情底部操作、搜索弹窗、`z-paging`）。部分 PC 能力（导出、Excel 导入、部分嵌套宽表）刻意弱化或后置，见下文「已知差距」。

---

## 2. 相关提交（按时间）

| Commit | 说明 |
|--------|------|
| `51f63e472` | 管理端 HR/团队工作台 + 招聘渠道 |
| `f4b59cd8e` | 组织管理 |
| `954781354` | 招聘候选人 |
| `5254883a1` | 招聘职位 |
| `a365dfb37` | **剩余模块大包**：考勤/社保/薪资/绩效/设置/员工端 + 交互收敛 + 菜单对齐 |

建议评审以 `51f63e472^..HEAD`（或至少 `a365dfb37`）为范围。

---

## 3. 目录与入口

### 3.1 代码位置

| 类型 | 路径 |
|------|------|
| API | `src/api/hrm/**` |
| 管理端/员工端页面 | `src/pages-hrm/**` |
| 含图表工作台 | `src/pages-statistics/hrm/{hr,team}/**` |
| 常量/格式 | `src/pages-hrm/utils/{constants,format,batch,performance,portal}.ts` |
| 字典 | `src/utils/constants/dict-enum.ts`（HRM_*） |
| 首页菜单 | `src/pages/index/menu.json` → 一级 **「HRM 人力资源」**（排在 WMS 后） |
| 分包 | `vite.config.ts` 已登记 `src/pages-hrm` |

### 3.2 首页如何进入

工作台左侧点 **HRM 人力资源**，按二级分组进入各叶子菜单。菜单 `name` / 顺序已尽量对齐后端 `system_menu`（叶子文案与 sort）；移动端仍用 `subGroups` 扁平展示（未完全复刻 PC 的「招聘设置 / 薪资设置」等中间目录层）。

**权限说明：**

- 菜单项带 `permission` 时，由 `getMenuGroups()` 过滤；无权限则整组可能消失。
- HR/团队工作台权限码为 `hrm:home:hr-query` / `hrm:home:team-query`（须与库表一致，见 §7）。

---

## 4. 已迁移模块清单

### 4.1 管理端

| 分组 | 菜单（对齐 PC 文案） | 主要路径 |
|------|----------------------|----------|
| 工作台 | HR 工作台、团队工作台 | `/pages-statistics/hrm/hr\|team/index` |
| 组织管理 | 组织管理 | `/pages-hrm/dept/index` |
| 招聘管理 | 候选人、招聘职位、招聘渠道、淘汰原因 | `/pages-hrm/recruit/**` |
| 员工管理 | 员工档案、员工设置 | `/pages-hrm/employee/**` |
| 考勤管理 | 打卡记录、请假记录、月度汇总、考勤组设置、节假日设置 | `/pages-hrm/attendance/**` |
| 社保管理 | 社保表、社保方案 | `/pages-hrm/insurance/**` |
| 薪资管理 | 月度工资表、历史工资表、薪资档案、发放记录、薪资组/计税/计薪/工资表设置、调薪模板 | `/pages-hrm/salary/**` |
| 绩效管理 | KPI 考核、绩效档案、考核指标模板、考核结果设置 | `/pages-hrm/performance/**` |

### 4.2 员工端（HRM 员工端）

| 菜单 | 路径 |
|------|------|
| 个人工作台 | `/pages-hrm/portal/home/index` |
| 我的档案 | `/pages-hrm/portal/employee/index` |
| 我的社保 | `/pages-hrm/portal/insurance/index` |
| 我的工资条 | `/pages-hrm/portal/salary/slip/index` |
| 考勤报表 | `/pages-hrm/portal/attendance/report/index` |
| KPI 考核 | `/pages-hrm/portal/performance/assessment/index` |
| 我的绩效档案 | `/pages-hrm/portal/performance/history/index` |

### 4.3 明确跳过 / 归并

| 项 | 处理 |
|----|------|
| 「业务参数设置」 | PC 已取消通用业务配置；能力归并招聘渠道 + 淘汰原因 |
| 管理端请假新增/改/删 | 按考勤决策：后台只读；创建在员工端 |
| 若干导出 / Excel 导入 | 移动端多数未做，差距见 §6 |

---

## 5. 交互与实现约定（评审重点）

迁移过程中按产品反馈收敛，请重点看是否符合：

1. **操作不放 navbar 右上角** → 用 `wd-fab` / `yd-detail-footer` / 详情「更多」。
2. **列表外置编辑/删除/启停等，详情可替代则去掉**；列表以进详情为主。
3. **删除优先放详情底部**（例：社保月表、发放记录）。
4. **批量**：保留业务强依赖的批量（如社保批量调整、候选人批量）；绩效档案列表批量已去掉；「已选 N」与批量按钮同处底栏。
5. **绩效**：员工端考核 / 管理端 KPI 计划的列表快捷操作已下沉详情；计划编辑补了目标确认、评分流程、审核/申诉节点、模板快照（仍为单页分组，非 PC 四步向导）。
6. **风格**：对齐 `AGENTS.md` + CRM（`pages-crm/clue`）+ 邻近 `pages-hrm/recruit/channel`；详情字段显式写 `wd-cell`，忌字段配置引擎。

---

## 6. 已知差距（相对 PC，非漏菜单）

评审时可当「可接受债务 / 后续迭代」，不必当成未迁模块：

| 领域 | 差距 |
|------|------|
| 通用 | 导出、Excel 导入多数未做；宽表改为卡片 + 下钻 |
| 员工档案 | 详情工资社保 Tab 未完整嵌薪资档案/参保/历史工资（独立菜单已有）；部分 PC 批量建档未做 |
| 招聘 | 淘汰原因不支持 PC `allowCreate` 自由输入；转员工依赖员工能力，部分 toast 引导 PC |
| 薪资 | 发送工资条完整向导未在月表做透；工资核算（含 Excel 导入 / sync multipart）整段不支持，入口提示去 PC 管理后台操作 |
| 绩效计划编辑 | 非四步向导；部门多选等偏弱 |
| 考勤组 | 打卡地点多为手填经纬度，无地图选点 |
| 日历 | 工作台日历未接农历（PC 有） |
| 菜单结构 | 中间「xx 设置」目录扁平进「xx 管理」分组，仅叶子名/顺序对齐 |

---

## 7. 环境与数据注意

### 7.1 本地服务

- H5：`http://127.0.0.1:9000`
- 后端：`http://127.0.0.1:48080`（库名常见 `ruoyi-vue-pro`）
- 账号：`admin` / `admin123`，`tenant-id: 1`

### 7.2 工作台权限曾踩坑（已修库）

库中旧权限曾为：

- `hrm:home:query`、`hrm:team-home:query`（错误）

应与接口一致：

- `hrm:home:hr-query`、`hrm:home:team-query`

本地已对 `system_menu` 7070–7073 做过 UPDATE，并为超管/普通角色补挂菜单。**若评审环境库未同步，会出现「有菜单码但对不上 / 首页看不到工作台」**——请核对该 4 条 permission，并重新登录。

### 7.3 员工端

需账号绑定 `hrm_employee.user_id`；未绑定会进开通引导页。冒烟时 admin 曾绑定「芋道源码」。

---

## 8. 建议评审路径（冒烟清单）

按风险优先级：

1. **首页菜单**：HRM 分组名、顺序、工作台权限可见性  
2. **员工档案**：列表 → 详情生命周期（入职/异动/离职）→ 附属档案 CRUD → 底部操作（非右上角）  
3. **招聘候选人 / 职位**：列表进详情、流转与批量（候选人）  
4. **月度工资表**：加载最近月、核算入口（提示 PC）、员工明细  
5. **社保表**：列表无删除、详情删除；添加/批量  
6. **KPI 计划**：列表无行内开启；详情启动/编辑字段  
7. **员工端**：个人工作台 → 档案 → 工资条已读 → 考勤请假 → 绩效待办进详情操作  

自动化截图曾落在 `/tmp/hrm-pw/*.png`（本机临时目录，不一定随仓保留）。

---

## 9. 静态检查建议

```bash
# 触达 HRM 时可 scoped
pnpm lint -- src/api/hrm src/pages-hrm src/pages-statistics/hrm src/pages/index/menu.json
pnpm exec vue-tsc --noEmit --skipLibCheck --pretty false
git diff --check
```

大包提交 `a365dfb37` 经 lint-staged / eslint --fix 通过。

---

## 10. 给评审人的提问清单（可选）

- [ ] 列表操作下沉详情是否过度（候选人流水线快捷是否保留合理）？  
- [ ] 未做导出/导入是否接受为移动端范围？  
- [ ] 员工详情是否还要嵌「工资社保」摘要区？  
- [ ] 菜单扁平「xx 管理」是否接受，是否要复刻 PC 中间「设置」目录？  
- [ ] 绩效计划单页编辑 vs 四步向导，产品是否满意？  

---

## 11. 不在本次范围

- 未改后端业务接口契约（仅本地修过菜单 permission 数据）  
- 未提交 / 未纳入：`AGENTS.md`、`pnpm-workspace.yaml`、`probe-menu.mjs`、`.claude/`  
- 未做 git push（除非另有指示）

---

## 12. 联系与续作建议

若续作，建议按「单菜单 + AGENTS 自查 + 冒烟、不自动提交」节奏；优先补：员工详情工资社保嵌套、工资条发送向导、导出能力按业务优先级挑选。

文档生成说明：基于迁移会话与上述 5 个 feat(hrm) commit 整理，供评审 handoff，不替代逐文件 CR。
