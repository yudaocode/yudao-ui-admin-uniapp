/** 科目类别枚举（对齐后端 FmsSubjectTypeEnum） */
export const FmsSubjectType = {
  ASSET: 1, // 资产
  LIABILITY: 2, // 负债
  EQUITY: 3, // 权益
  COST: 4, // 成本
  PROFIT_LOSS: 5, // 损益
  COMMON: 6, // 共同
} as const

/** 根科目编号 */
export const FMS_SUBJECT_PARENT_ID_ROOT = 0

/** 科目类别选项（共同类不参与新增） */
export const FmsSubjectTypeOptions = [
  { label: '资产', value: FmsSubjectType.ASSET },
  { label: '负债', value: FmsSubjectType.LIABILITY },
  { label: '权益', value: FmsSubjectType.EQUITY },
  { label: '成本', value: FmsSubjectType.COST },
  { label: '损益', value: FmsSubjectType.PROFIT_LOSS },
] as const

/** 科目余额方向枚举（对齐后端 FmsSubjectBalanceDirectionEnum） */
export const FmsDebitCreditDirection = {
  DEBIT: 1, // 借
  CREDIT: 2, // 贷
} as const

/** 科目状态枚举 */
export const FmsSubjectStatus = {
  ENABLED: 0, // 启用
  DISABLED: 1, // 停用
} as const

/** 会计制度选项 */
export const FmsAccountingStandardOptions = [
  { label: '小企业会计准则（2013 年颁）', value: 1 },
] as const

/** 币别编码 */
export const FmsCurrencyCode = {
  RMB: 'RMB', // 人民币
} as const

/** 币别选项 */
export const FmsCurrencyOptions = [
  { label: '人民币（RMB）', value: FmsCurrencyCode.RMB },
] as const

/** 账簿余额方向模式 */
export const FmsLedgerBalanceMode = {
  SAME_AS_SUBJECT: 1, // 与科目方向相同
  OPPOSITE_TO_SUBJECT: 2, // 与科目方向相反
} as const

/** 账簿余额方向模式选项 */
export const FmsLedgerBalanceModeOptions = [
  { label: '与科目方向相同', value: FmsLedgerBalanceMode.SAME_AS_SUBJECT },
  { label: '与科目方向相反', value: FmsLedgerBalanceMode.OPPOSITE_TO_SUBJECT },
] as const

/** 科目余额表节点类型 */
export const FmsSubjectBalanceNodeType = {
  SUBJECT: 1, // 科目节点
  AUXILIARY_COMBINATION: 2, // 辅助核算组合节点
} as const

/** 科目默认层级与编码规则 */
export const FMS_DEFAULT_SUBJECT_LEVEL = 4
export const FMS_DEFAULT_SUBJECT_CODE_RULE = '4-2-2-2'
export const FMS_SUBJECT_LEVEL_MIN = 1
export const FMS_SUBJECT_LEVEL_MAX = 8
export const FMS_SUBJECT_CODE_LENGTH_MIN = 2
export const FMS_SUBJECT_CODE_LENGTH_MAX = 5

/** 辅助核算类别枚举 */
export const FmsAuxiliaryType = {
  CUSTOMER: 1, // 客户
  SUPPLIER: 2, // 供应商
  EMPLOYEE: 3, // 职员
  PROJECT: 4, // 项目
  DEPARTMENT: 5, // 部门
  INVENTORY: 6, // 存货
  CUSTOM: 7, // 自定义
} as const

/** 辅助核算类别选项 */
export const FmsAuxiliaryTypeOptions = [
  { label: '客户', value: FmsAuxiliaryType.CUSTOMER },
  { label: '供应商', value: FmsAuxiliaryType.SUPPLIER },
  { label: '职员', value: FmsAuxiliaryType.EMPLOYEE },
  { label: '项目', value: FmsAuxiliaryType.PROJECT },
  { label: '部门', value: FmsAuxiliaryType.DEPARTMENT },
  { label: '存货', value: FmsAuxiliaryType.INVENTORY },
  { label: '自定义', value: FmsAuxiliaryType.CUSTOM },
] as const

/** 凭证审核状态枚举（对齐后端 FmsVoucherStatusEnum） */
export const FmsVoucherStatus = {
  PENDING_REVIEW: 0, // 待审核
  APPROVED: 1, // 已审核
} as const

/** 凭证审核状态选项 */
export const FmsVoucherStatusOptions = [
  { label: '待审核', value: FmsVoucherStatus.PENDING_REVIEW },
  { label: '已审核', value: FmsVoucherStatus.APPROVED },
] as const

/** 凭证附件允许上传的文件类型 */
export const FMS_VOUCHER_ATTACHMENT_FILE_TYPES: string[] = ['jpg', 'jpeg', 'png', 'bmp']

/** 凭证整理方式 */
export const FmsVoucherTidyType = {
  FILL_GAPS: 1, // 按凭证号顺次前移补齐断号
  REORDER_BY_TIME: 2, // 按凭证日期重新顺次编号
} as const

/** 凭证整理方式选项 */
export const FmsVoucherTidyTypeOptions = [
  { label: '按凭证号顺次前移补齐断号', value: FmsVoucherTidyType.FILL_GAPS },
  { label: '按凭证日期重新顺次编号', value: FmsVoucherTidyType.REORDER_BY_TIME },
] as const

/** 报表公式取数规则 */
export const FmsFormulaRule = {
  BALANCE: 0, // 余额
  DEBIT_BALANCE: 1, // 借方余额
  CREDIT_BALANCE: 2, // 贷方余额
  SUBJECT_DEBIT_BALANCE: 3, // 科目借方余额
  SUBJECT_CREDIT_BALANCE: 4, // 科目贷方余额
  DEBIT_AMOUNT: 5, // 借方发生额
  CREDIT_AMOUNT: 6, // 贷方发生额
  PROFIT_LOSS_AMOUNT: 7, // 损益发生额
} as const

/** 结账类型 */
export const FmsClosingType = {
  REGULAR: 1, // 常规结账
  PROFIT_LOSS: 2, // 结转损益
  UNPAID_VAT: 3, // 结转未交增值税
  LOCAL_TAX: 4, // 计提地方税金
  INCOME_TAX: 5, // 计提所得税
} as const

/** 结账模板分类 */
export const FmsClosingTemplateCategory = {
  DAILY_EXPENSE: 1, // 日常开支
  PURCHASE_SALE: 2, // 采购销售
  CURRENT_ACCOUNT: 3, // 往来款
  TRANSFER_BUSINESS: 4, // 转账业务
} as const

/** 结账模板分类选项 */
export const FmsClosingTemplateCategoryOptions = [
  { label: '日常开支', value: FmsClosingTemplateCategory.DAILY_EXPENSE },
  { label: '采购销售', value: FmsClosingTemplateCategory.PURCHASE_SALE },
  { label: '往来款', value: FmsClosingTemplateCategory.CURRENT_ACCOUNT },
  { label: '转账业务', value: FmsClosingTemplateCategory.TRANSFER_BUSINESS },
] as const

/** 结账取数时点 */
export const FmsClosingTimeType = {
  PERIOD_END: 1, // 期末
  PERIOD_BEGIN: 2, // 期初
  YEAR_BEGIN: 3, // 年初
} as const

/** 结账取数时点选项 */
export const FmsClosingTimeTypeOptions = [
  { label: '期末', value: FmsClosingTimeType.PERIOD_END },
  { label: '期初', value: FmsClosingTimeType.PERIOD_BEGIN },
  { label: '年初', value: FmsClosingTimeType.YEAR_BEGIN },
] as const

/** 结转损益凭证类型 */
export const FmsClosingVoucherType = {
  SEPARATE_GAIN_AND_LOSS: 1, // 收益和损失分开结转
  COMBINED_GAIN_AND_LOSS: 2, // 收益和损失同时结转
} as const

/** 结转损益凭证类型选项 */
export const FmsClosingVoucherTypeOptions = [
  { label: '收益和损失分开结转（分别生成收益凭证和损失凭证）', value: FmsClosingVoucherType.SEPARATE_GAIN_AND_LOSS },
  { label: '收益和损失同时结转', value: FmsClosingVoucherType.COMBINED_GAIN_AND_LOSS },
] as const

/** 财务报表类型 */
export const FmsReportType = {
  BALANCE_SHEET: 1, // 资产负债表
  INCOME_STATEMENT: 2, // 利润表
  CASH_FLOW_STATEMENT: 3, // 现金流量表
} as const

/** 首页财务指标取数报表类型 */
export const FmsFinanceIndicatorType = {
  BALANCE_SHEET: FmsReportType.BALANCE_SHEET, // 资产负债表
  INCOME_STATEMENT: FmsReportType.INCOME_STATEMENT, // 利润表
} as const

/** 财务指标取数报表类型选项 */
export const FmsFinanceIndicatorTypeOptions = [
  { label: '资产负债表', value: FmsFinanceIndicatorType.BALANCE_SHEET },
  { label: '利润表', value: FmsFinanceIndicatorType.INCOME_STATEMENT },
] as const

/** 资产负债表公式取数规则选项 */
export const FmsBalanceFormulaRuleOptions = [
  { label: '余额', value: FmsFormulaRule.BALANCE },
  { label: '借方余额', value: FmsFormulaRule.DEBIT_BALANCE },
  { label: '贷方余额', value: FmsFormulaRule.CREDIT_BALANCE },
  { label: '科目借方余额', value: FmsFormulaRule.SUBJECT_DEBIT_BALANCE },
  { label: '科目贷方余额', value: FmsFormulaRule.SUBJECT_CREDIT_BALANCE },
] as const

/** 利润表公式取数规则选项 */
export const FmsIncomeFormulaRuleOptions = [
  { label: '借方发生额', value: FmsFormulaRule.DEBIT_AMOUNT },
  { label: '贷方发生额', value: FmsFormulaRule.CREDIT_AMOUNT },
  { label: '损益发生额', value: FmsFormulaRule.PROFIT_LOSS_AMOUNT },
] as const

/** 首页指标颜色 */
export const FMS_HOME_METRIC_COLORS = ['#4e80ee', '#f6bd16', '#5ad8a6', '#e8684a', '#9270ca']
