<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="初始余额"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <template v-if="fmsStore.accountSet">
      <!-- 账套切换 -->
      <view class="p-24rpx pb-0">
        <AccountSetSwitch @change="loadPage" />
      </view>

      <!-- 科目类别 -->
      <view class="mt-24rpx bg-white">
        <scroll-view scroll-x class="whitespace-nowrap">
          <wd-radio-group v-model="subjectType" type="button" class="px-24rpx py-16rpx" @change="handleTypeChange">
            <wd-radio
              v-for="option in FmsSubjectTypeOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </wd-radio>
          </wd-radio-group>
        </scroll-view>
      </view>

      <!-- 操作按钮 -->
      <view class="flex flex-wrap gap-16rpx p-24rpx pb-0">
        <wd-button
          v-if="canSave"
          type="primary"
          size="small"
          :loading="saving"
          @click="handleSave"
        >
          保存
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['fms:config:initial-balance:query'])"
          type="primary"
          variant="plain"
          size="small"
          @click="openTrialBalance"
        >
          试算平衡
        </wd-button>
        <wd-button
          v-if="canImport"
          type="warning"
          variant="plain"
          size="small"
          @click="handleImport"
        >
          导入
        </wd-button>
      </view>

      <!-- 提示信息 -->
      <view class="p-24rpx pb-0">
        <view v-if="isJanuary" class="rounded-12rpx bg-[#e6f4ff] p-20rpx text-26rpx text-[#1677ff]">
          账套从一月启用，只需录入期初余额
        </view>
        <view v-else-if="accountStartMonth && !editable" class="rounded-12rpx bg-[#fff7e6] p-20rpx text-26rpx text-[#d46b08]">
          账套已结账，初始余额不可修改
        </view>
        <view v-if="edited" class="mt-16rpx rounded-12rpx bg-[#fff7e6] p-20rpx text-26rpx text-[#d46b08]">
          当前修改尚未保存，切换科目类别或离开页面前请先保存
        </view>
      </view>

      <!-- 初始余额列表 -->
      <view class="p-24rpx">
        <view
          v-for="row in tableData"
          :key="row.rowKey"
          class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
        >
          <!-- 行头：编码名称、余额方向 -->
          <view class="flex items-center justify-between gap-16rpx">
            <view class="min-w-0 flex-1" :style="{ paddingLeft: `${(row.level - 1) * 24}rpx` }">
              <text class="text-30rpx font-semibold" :class="row.isAssist ? 'text-[#666]' : 'text-[#333]'">
                {{ row.isAssist ? getRowName(row) : `${row.subjectCode} ${row.subjectName}` }}
              </text>
            </view>
            <wd-tag :type="row.balanceDirection === FmsDebitCreditDirection.DEBIT ? 'primary' : 'warning'" plain>
              {{ row.balanceDirection === FmsDebitCreditDirection.DEBIT ? '借' : '贷' }}
            </wd-tag>
          </view>

          <!-- 行操作：辅助核算明细 -->
          <view v-if="canAddAssist(row) || (row.isAssist && canEditRow(row))" class="mt-16rpx flex gap-16rpx">
            <wd-button
              v-if="canAddAssist(row)"
              size="small"
              type="primary"
              variant="plain"
              @click="openAssistForm(row)"
            >
              添加明细
            </wd-button>
            <wd-button
              v-if="row.isAssist && canEditRow(row)"
              size="small"
              type="danger"
              variant="plain"
              @click="removeAssist(row)"
            >
              删除明细
            </wd-button>
          </view>

          <!-- 期初余额 -->
          <view class="mt-16rpx flex items-center justify-between rounded-8rpx bg-[#f8f8f8] p-16rpx">
            <text class="text-26rpx text-[#666]">期初金额</text>
            <wd-input-number
              v-if="canEditRow(row)"
              v-model="row.openingAmount"
              :min="0"
              :precision="2"
              @change="handleAmountChange(row)"
            />
            <text v-else class="text-26rpx text-[#333]">{{ formatFmsAmount(row.openingAmount) }}</text>
          </view>
          <view v-if="row.quantityAccounting" class="mt-12rpx flex items-center justify-between rounded-8rpx bg-[#f8f8f8] p-16rpx">
            <text class="text-26rpx text-[#666]">期初数量{{ row.quantityUnit ? `（${row.quantityUnit}）` : '' }}</text>
            <wd-input-number
              v-if="canEditRow(row)"
              v-model="row.openingQuantity"
              :min="0"
              :precision="4"
              @change="handleAmountChange(row)"
            />
            <text v-else class="text-26rpx text-[#333]">{{ formatFmsQuantity(row.openingQuantity) }}</text>
          </view>

          <!-- 年中启用时需要录入累计发生额 -->
          <template v-if="!isJanuary">
            <view class="mt-12rpx flex items-center justify-between rounded-8rpx bg-[#f8f8f8] p-16rpx">
              <text class="text-26rpx text-[#666]">本年累计借方金额</text>
              <wd-input-number
                v-if="canEditRow(row)"
                v-model="row.yearDebitAmount"
                :min="0"
                :precision="2"
                @change="handleAmountChange(row)"
              />
              <text v-else class="text-26rpx text-[#333]">{{ formatFmsAmount(row.yearDebitAmount) }}</text>
            </view>
            <view v-if="row.quantityAccounting" class="mt-12rpx flex items-center justify-between rounded-8rpx bg-[#f8f8f8] p-16rpx">
              <text class="text-26rpx text-[#666]">本年累计借方数量</text>
              <wd-input-number
                v-if="canEditRow(row)"
                v-model="row.yearDebitQuantity"
                :min="0"
                :precision="4"
                @change="handleAmountChange(row)"
              />
              <text v-else class="text-26rpx text-[#333]">{{ formatFmsQuantity(row.yearDebitQuantity) }}</text>
            </view>
            <view class="mt-12rpx flex items-center justify-between rounded-8rpx bg-[#f8f8f8] p-16rpx">
              <text class="text-26rpx text-[#666]">本年累计贷方金额</text>
              <wd-input-number
                v-if="canEditRow(row)"
                v-model="row.yearCreditAmount"
                :min="0"
                :precision="2"
                @change="handleAmountChange(row)"
              />
              <text v-else class="text-26rpx text-[#333]">{{ formatFmsAmount(row.yearCreditAmount) }}</text>
            </view>
            <view v-if="row.quantityAccounting" class="mt-12rpx flex items-center justify-between rounded-8rpx bg-[#f8f8f8] p-16rpx">
              <text class="text-26rpx text-[#666]">本年累计贷方数量</text>
              <wd-input-number
                v-if="canEditRow(row)"
                v-model="row.yearCreditQuantity"
                :min="0"
                :precision="4"
                @change="handleAmountChange(row)"
              />
              <text v-else class="text-26rpx text-[#333]">{{ formatFmsQuantity(row.yearCreditQuantity) }}</text>
            </view>

            <!-- 年初余额由期初余额和累计发生额按余额方向计算 -->
            <view class="mt-12rpx flex items-center justify-between rounded-8rpx bg-[#f8f8f8] p-16rpx">
              <text class="text-26rpx text-[#666]">年初金额</text>
              <text class="text-26rpx text-[#333]">{{ formatFmsAmount(row.yearOpeningAmount) }}</text>
            </view>
            <view v-if="row.quantityAccounting" class="mt-12rpx flex items-center justify-between rounded-8rpx bg-[#f8f8f8] p-16rpx">
              <text class="text-26rpx text-[#666]">年初数量</text>
              <text class="text-26rpx text-[#333]">{{ formatFmsQuantity(row.yearOpeningQuantity) }}</text>
            </view>

            <!-- 损益类科目需要录入实际损益发生额 -->
            <template v-if="showProfitLoss">
              <view class="mt-12rpx flex items-center justify-between rounded-8rpx bg-[#f8f8f8] p-16rpx">
                <text class="text-26rpx text-[#666]">实际损益发生额</text>
                <wd-input-number
                  v-if="canEditRow(row)"
                  v-model="row.profitLossAmount"
                  :min="0"
                  :precision="2"
                  @change="handleProfitLossAmountChange"
                />
                <text v-else class="text-26rpx text-[#333]">{{ formatFmsAmount(row.profitLossAmount) }}</text>
              </view>
              <view v-if="row.quantityAccounting" class="mt-12rpx flex items-center justify-between rounded-8rpx bg-[#f8f8f8] p-16rpx">
                <text class="text-26rpx text-[#666]">实际损益发生数量</text>
                <wd-input-number
                  v-if="canEditRow(row)"
                  v-model="row.profitLossQuantity"
                  :min="0"
                  :precision="4"
                  @change="handleProfitLossAmountChange"
                />
                <text v-else class="text-26rpx text-[#333]">{{ formatFmsQuantity(row.profitLossQuantity) }}</text>
              </view>
            </template>
          </template>
        </view>

        <!-- 空状态 -->
        <view v-if="!loading && tableData.length === 0" class="py-100rpx text-center">
          <wd-empty icon="content" tip="暂无初始余额数据" />
        </view>
      </view>
    </template>

    <!-- 无可用账套引导 -->
    <AccountSetGuide v-else-if="fmsStore.accountSetListLoaded" />

    <!-- 添加明细和试算平衡弹窗 -->
    <AssistForm ref="assistFormRef" :account-set-id="fmsStore.accountSet?.id" @success="addAssist" />
    <TrialBalanceDialog ref="trialBalanceRef" />
  </view>
</template>

<script lang="ts" setup>
import type {
  InitialBalance,
  InitialBalanceAmounts,
  InitialBalanceAssist,
  InitialBalanceAuxiliaryItem,
  InitialBalanceUpdate,
} from '@/api/fms/config/initial-balance'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { getAccountSet } from '@/api/fms/config/account-set'
import { getInitialBalanceList, saveInitialBalance } from '@/api/fms/config/initial-balance'
import { useAccess } from '@/hooks/useAccess'
import AccountSetGuide from '@/pages-fms/components/account-set/guide.vue'
import AccountSetSwitch from '@/pages-fms/components/account-set/switch.vue'
import { useFmsStore } from '@/pages-fms/store/fms'
import { FmsDebitCreditDirection, FmsSubjectType, FmsSubjectTypeOptions } from '@/pages-fms/utils/constants'
import { formatFmsAmount, formatFmsQuantity, formatFmsStartTime } from '@/pages-fms/utils/format'
import { navigateBackPlus } from '@/utils'
import AssistForm from './components/assist-form.vue'
import TrialBalanceDialog from './components/trial-balance-dialog.vue'

/** 初始余额平铺行：科目行在前，辅助核算明细行紧跟所属科目 */
type ViewRow = InitialBalance & {
  rowKey: string // 行唯一标识
  isAssist?: boolean // 是否辅助核算明细行
  isLeaf?: boolean // 是否末级科目
  level: number // 展示层级
  auxiliaryItemIds?: number[] // 辅助核算项目编号数组
  auxiliaries?: InitialBalanceAuxiliaryItem[] // 辅助核算项目数组
}

/** 金额和数量字段，父级行由子级行汇总 */
const AMOUNT_FIELDS: (keyof InitialBalanceAmounts)[] = [
  'openingAmount',
  'openingQuantity',
  'yearDebitAmount',
  'yearDebitQuantity',
  'yearCreditAmount',
  'yearCreditQuantity',
  'yearOpeningAmount',
  'yearOpeningQuantity',
  'profitLossAmount',
  'profitLossQuantity',
]
/** 汇总时不区分余额方向、直接累加的字段 */
const DIRECT_SUM_FIELDS: Set<keyof InitialBalanceAmounts> = new Set<keyof InitialBalanceAmounts>([
  'yearDebitAmount',
  'yearDebitQuantity',
  'yearCreditAmount',
  'yearCreditQuantity',
])

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const dialog = useDialog()
const fmsStore = useFmsStore()
const loading = ref(false) // 列表加载状态
const saving = ref(false) // 保存提交状态
const edited = ref(false) // 是否存在未保存修改
const subjectType = ref<number>(FmsSubjectType.ASSET) // 当前科目类别
const loadedSubjectType = ref<number>(subjectType.value) // 当前列表对应的科目类别
const tableData = ref<ViewRow[]>([]) // 平铺行数据
const accountStartMonth = ref('') // 账套启用期间，格式为 YYYY-MM
const assistSubject = ref<ViewRow>() // 正在添加辅助核算明细的科目
const assistFormRef = ref<InstanceType<typeof AssistForm>>()
const trialBalanceRef = ref<InstanceType<typeof TrialBalanceDialog>>()

const isJanuary = computed(() => accountStartMonth.value.endsWith('-01')) // 账套是否从一月启用
/** 是否可编辑：结账后初始余额不可修改 */
const editable = computed(() =>
  !!accountStartMonth.value
  && !!fmsStore.currentMonth
  && fmsStore.currentMonth === accountStartMonth.value,
)
const showProfitLoss = computed(() => !isJanuary.value && subjectType.value === FmsSubjectType.PROFIT_LOSS) // 是否展示实际损益发生额

/** 启用期间可编辑、账套可写且有修改权限时才允许保存 */
const canSave = computed(() => editable.value && fmsStore.isAccountSetWritable && hasAccessByCodes(['fms:config:initial-balance:update']))
/** 启用期间可编辑、账套可写且有导入权限时才展示导入入口 */
const canImport = computed(() => editable.value && fmsStore.isAccountSetWritable && hasAccessByCodes(['fms:config:initial-balance:import']))

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 加载账套信息、初始余额列表和当前会计期间 */
async function loadPage() {
  const accountSetId = fmsStore.accountSet?.id
  if (!accountSetId) {
    tableData.value = []
    return
  }
  loading.value = true
  try {
    const [accountSet, balances] = await Promise.all([
      getAccountSet(accountSetId),
      getInitialBalanceList(accountSetId, subjectType.value),
      fmsStore.loadCurrentMonth(),
    ])
    accountStartMonth.value = formatFmsStartTime(accountSet.startTime)
    tableData.value = buildViewRows(balances)
    loadedSubjectType.value = subjectType.value
    edited.value = false
  } finally {
    loading.value = false
  }
}

/** 切换科目类别 */
async function handleTypeChange() {
  if (subjectType.value === loadedSubjectType.value) {
    return
  }
  if (edited.value) {
    try {
      await dialog.confirm({
        title: '提示',
        msg: '当前修改尚未保存，确定放弃修改并切换科目类别吗？',
      })
    } catch {
      subjectType.value = loadedSubjectType.value
      return
    }
  }
  if (isJanuary.value && subjectType.value === FmsSubjectType.PROFIT_LOSS) {
    toast.warning('年初启用的账套不需要录入损益初始余额')
    subjectType.value = loadedSubjectType.value
    return
  }
  await loadPage()
}

/** 构建平铺行：父级科目在前，辅助核算明细紧跟所属科目 */
function buildViewRows(list: InitialBalance[]): ViewRow[] {
  const rows: ViewRow[] = []
  const levelMap = new Map<number, number>()
  const parentIds = new Set(list.map(item => item.parentId))
  list.forEach((item) => {
    const level = (item.parentId ? levelMap.get(item.parentId) || 0 : 0) + 1
    levelMap.set(item.subjectId, level)
    const subjectRow: ViewRow = {
      ...item,
      rowKey: `subject-${item.subjectId}`,
      isLeaf: !parentIds.has(item.subjectId),
      level,
    }
    rows.push(subjectRow)
    item.assistBalances.forEach((assist, index) => {
      rows.push(buildAssistViewRow(subjectRow, assist, index))
    })
  })
  return rows
}

/** 构建辅助核算明细行 */
function buildAssistViewRow(subject: ViewRow, assist: InitialBalanceAssist, index: number): ViewRow {
  return {
    ...subject,
    ...assist,
    rowKey: `assist-${subject.subjectId}-${assist.assistCombinationId || index}`,
    isAssist: true,
    level: subject.level + 1,
    auxiliaryItemIds: assist.auxiliaries.map(item => item.itemId),
    assistBalances: [],
  }
}

/** 获得行名称，辅助明细行拼接“科目名称_项目名称” */
function getRowName(row: ViewRow) {
  if (!row.isAssist) {
    return row.subjectName
  }
  return `${row.subjectName}_${row.auxiliaries?.map(item => item.name).join('_')}`
}

/** 判断是否可编辑：辅助明细行，或未启用辅助核算的末级科目行 */
function canEditRow(row: ViewRow) {
  return (
    canSave.value
    && (row.isAssist || (row.isLeaf && !row.auxiliaryAccounting))
  )
}

/** 判断是否可添加明细：启用辅助核算的末级科目行 */
function canAddAssist(row: ViewRow) {
  return (
    canSave.value
    && !row.isAssist
    && !!row.isLeaf
    && row.auxiliaryAccounting
  )
}

/** 打开添加明细弹窗 */
function openAssistForm(row: ViewRow) {
  assistSubject.value = row
  assistFormRef.value?.open(row)
}

/** 添加辅助核算明细行 */
function addAssist(auxiliaries: InitialBalanceAuxiliaryItem[]) {
  const subject = assistSubject.value
  if (!subject) {
    return
  }
  const auxiliaryItemIds = auxiliaries.map(item => item.itemId)
  // 相同辅助核算组合的明细只允许添加一次
  const exists = tableData.value.some(row =>
    row.isAssist
    && row.subjectId === subject.subjectId
    && row.auxiliaryItemIds?.length === auxiliaryItemIds.length
    && auxiliaryItemIds.every(id => row.auxiliaryItemIds?.includes(id)),
  )
  if (exists) {
    toast.warning('该辅助核算明细已存在')
    return
  }
  // 插入到所属科目的最后一条辅助明细之后
  let insertIndex = tableData.value.findIndex(row => row.rowKey === subject.rowKey) + 1
  while (
    insertIndex < tableData.value.length
    && tableData.value[insertIndex].isAssist
    && tableData.value[insertIndex].subjectId === subject.subjectId
  ) {
    insertIndex++
  }
  tableData.value.splice(insertIndex, 0, buildAssistViewRow(subject, { ...zeroAmounts(), auxiliaries }, Date.now()))
  edited.value = true
  aggregateRows()
}

/** 删除辅助核算明细行 */
function removeAssist(row: ViewRow) {
  tableData.value = tableData.value.filter(item => item.rowKey !== row.rowKey)
  edited.value = true
  aggregateRows()
}

/** 金额变化时按余额方向重算年初余额，并汇总父级 */
function handleAmountChange(row: ViewRow) {
  if (!isJanuary.value) {
    if (row.balanceDirection === FmsDebitCreditDirection.DEBIT) {
      row.yearOpeningAmount = row.openingAmount - row.yearDebitAmount + row.yearCreditAmount
      row.yearOpeningQuantity = row.openingQuantity - row.yearDebitQuantity + row.yearCreditQuantity
    } else {
      row.yearOpeningAmount = row.openingAmount + row.yearDebitAmount - row.yearCreditAmount
      row.yearOpeningQuantity = row.openingQuantity + row.yearDebitQuantity - row.yearCreditQuantity
    }
  }
  edited.value = true
  aggregateRows()
}

/** 实际损益发生额变化时标记未保存并汇总父级 */
function handleProfitLossAmountChange() {
  edited.value = true
  aggregateRows()
}

/** 汇总父级科目余额：辅助明细计入所属科目，子科目计入父科目 */
function aggregateRows() {
  const rows = tableData.value
  const subjectMap = new Map<number, ViewRow>()
  // 1. 非末级科目和启用辅助核算的科目由明细汇总，先清零
  rows.forEach((row) => {
    if (row.isAssist) {
      return
    }
    subjectMap.set(row.subjectId, row)
    if (!row.isLeaf || row.auxiliaryAccounting) {
      AMOUNT_FIELDS.forEach(field => (row[field] = 0))
    }
  })
  // 2. 平铺列表父级在前，倒序遍历时子级先完成汇总，再逐级累加到父级
  for (let index = rows.length - 1; index >= 0; index--) {
    const row = rows[index]
    const parent = row.isAssist ? subjectMap.get(row.subjectId) : subjectMap.get(row.parentId!)
    if (!parent) {
      continue
    }
    AMOUNT_FIELDS.forEach((field) => {
      const amount = Number(row[field] || 0)
      parent[field]
        = Number(parent[field] || 0)
          + (DIRECT_SUM_FIELDS.has(field) || row.balanceDirection === parent.balanceDirection ? amount : -amount)
    })
  }
}

/** 打开试算平衡弹窗 */
function openTrialBalance() {
  const accountSetId = fmsStore.accountSet?.id
  if (!accountSetId) {
    return
  }
  trialBalanceRef.value?.open(accountSetId)
}

/** 导入初始余额：Excel 导入需要在 PC 端管理后台操作 */
function handleImport() {
  dialog.alert({
    title: '导入初始余额',
    msg: 'Excel 导入请在 PC 端管理后台操作',
  })
}

/** 保存初始余额 */
async function handleSave() {
  const accountSetId = fmsStore.accountSet?.id
  if (!accountSetId || !editable.value) {
    return
  }
  const assistRows = tableData.value.filter(row => row.isAssist)
  const balances: InitialBalanceUpdate[] = tableData.value
    .filter(row => !row.isAssist && row.isLeaf)
    .map(row => ({
      subjectId: row.subjectId,
      ...pickAmounts(row),
      assistBalances: assistRows
        .filter(item => item.subjectId === row.subjectId)
        .map(item => ({
          auxiliaryItemIds: item.auxiliaryItemIds || [],
          ...pickAmounts(item),
        })),
    }))
  if (!balances.length) {
    return
  }
  if (
    subjectType.value === FmsSubjectType.PROFIT_LOSS
    && balances.some(item => Math.abs(item.yearOpeningAmount) >= 0.005)
  ) {
    toast.warning('损益类科目的年初余额必须为 0')
    return
  }
  saving.value = true
  try {
    await saveInitialBalance({ accountSetId, balances })
    toast.success('保存成功')
    await loadPage()
  } finally {
    saving.value = false
  }
}

/** 提取行的金额和数量字段 */
function pickAmounts(row: ViewRow): InitialBalanceAmounts {
  return {
    openingAmount: Number(row.openingAmount || 0),
    openingQuantity: Number(row.openingQuantity || 0),
    yearDebitAmount: Number(row.yearDebitAmount || 0),
    yearDebitQuantity: Number(row.yearDebitQuantity || 0),
    yearCreditAmount: Number(row.yearCreditAmount || 0),
    yearCreditQuantity: Number(row.yearCreditQuantity || 0),
    yearOpeningAmount: Number(row.yearOpeningAmount || 0),
    yearOpeningQuantity: Number(row.yearOpeningQuantity || 0),
    profitLossAmount: Number(row.profitLossAmount || 0),
    profitLossQuantity: Number(row.profitLossQuantity || 0),
  }
}

/** 构建全零的金额和数量字段 */
function zeroAmounts(): InitialBalanceAmounts {
  return {
    openingAmount: 0,
    openingQuantity: 0,
    yearDebitAmount: 0,
    yearDebitQuantity: 0,
    yearCreditAmount: 0,
    yearCreditQuantity: 0,
    yearOpeningAmount: 0,
    yearOpeningQuantity: 0,
    profitLossAmount: 0,
    profitLossQuantity: 0,
  }
}

/** 初始化 */
onMounted(async () => {
  await fmsStore.loadAccountSetList()
  await loadPage()
  uni.$on('fms:config:initial-balance:reload', loadPage)
})

/** 卸载 */
onUnload(() => {
  uni.$off('fms:config:initial-balance:reload', loadPage)
})
</script>
