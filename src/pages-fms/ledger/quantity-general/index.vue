<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="数量金额总账"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <template v-if="hasAccessByCodes(['fms:ledger:general:query'])">
      <template v-if="fmsStore.accountSet">
        <!-- 账套切换 -->
        <view class="p-24rpx pb-0">
          <AccountSetSwitch @change="handleAccountSetChange" />
        </view>

        <!-- 搜索组件 -->
        <!-- TODO @AI：间隙；看看别的模块，有没类似的情况 -->
        <SearchForm
          show-subject-range
          :default-min-level="FMS_SUBJECT_LEVEL_MIN"
          :default-max-level="FMS_SUBJECT_LEVEL_MAX"
          search-placeholder="搜索数量金额总账"
          @search="handleQuery"
          @reset="handleQuery"
        />

        <!-- 数量金额总账列表 -->
        <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
          <view class="p-24rpx">
            <!-- 加载状态 -->
            <view
              v-if="loading"
              class="rounded-12rpx bg-white py-64rpx text-center text-26rpx text-[#999] shadow-sm"
            >
              <wd-loading size="32rpx" />
              <view class="mt-12rpx">
                正在加载账簿数据
              </view>
            </view>

            <template v-else-if="flatList.length">
              <view
                v-for="(item, index) in flatList"
                :key="index"
                class="mb-20rpx rounded-12rpx bg-white p-24rpx shadow-sm"
                :style="{ marginLeft: `${item.depth * 32}rpx` }"
              >
                <!-- 科目标题 -->
                <view class="mb-16rpx truncate text-30rpx text-[#333] font-semibold">
                  {{ item.node.subjectCode }} {{ item.node.subjectName }}
                  <text v-if="item.node.quantityUnit" class="text-24rpx text-[#999] font-normal">
                    （{{ item.node.quantityUnit }}）
                  </text>
                </view>
                <!-- 数量与金额 -->
                <view class="flex items-center justify-between gap-12rpx py-6rpx text-26rpx">
                  <text class="flex-shrink-0 text-[#999]">期初余额</text>
                  <text class="text-[#333]">
                    {{ item.node.openingBalanceDirection || '-' }}
                    数量 {{ formatFmsQuantity(item.node.openingQuantity, item.node.quantityAccounting) }}
                    单价 {{ formatFmsMoney(item.node.openingUnitPrice) }}
                    金额 {{ formatFmsMoney(getOpeningAmount(item.node)) }}
                  </text>
                </view>
                <view class="flex items-center justify-between gap-12rpx py-6rpx text-26rpx">
                  <text class="flex-shrink-0 text-[#999]">本期借方</text>
                  <text class="text-[#333]">
                    数量 {{ formatFmsQuantity(item.node.periodDebitQuantity, item.node.quantityAccounting) }}
                    金额 {{ formatFmsMoney(item.node.periodDebitAmount) }}
                  </text>
                </view>
                <view class="flex items-center justify-between gap-12rpx py-6rpx text-26rpx">
                  <text class="flex-shrink-0 text-[#999]">本期贷方</text>
                  <text class="text-[#333]">
                    数量 {{ formatFmsQuantity(item.node.periodCreditQuantity, item.node.quantityAccounting) }}
                    金额 {{ formatFmsMoney(item.node.periodCreditAmount) }}
                  </text>
                </view>
                <view class="flex items-center justify-between gap-12rpx py-6rpx text-26rpx">
                  <text class="flex-shrink-0 text-[#999]">累计借方</text>
                  <text class="text-[#333]">
                    数量 {{ formatFmsQuantity(item.node.yearDebitQuantity, item.node.quantityAccounting) }}
                    金额 {{ formatFmsMoney(item.node.yearDebitAmount) }}
                  </text>
                </view>
                <view class="flex items-center justify-between gap-12rpx py-6rpx text-26rpx">
                  <text class="flex-shrink-0 text-[#999]">累计贷方</text>
                  <text class="text-[#333]">
                    数量 {{ formatFmsQuantity(item.node.yearCreditQuantity, item.node.quantityAccounting) }}
                    金额 {{ formatFmsMoney(item.node.yearCreditAmount) }}
                  </text>
                </view>
                <view class="flex items-center justify-between gap-12rpx py-6rpx text-26rpx">
                  <text class="flex-shrink-0 text-[#999]">期末余额</text>
                  <text class="text-[#333]">
                    {{ item.node.endingBalanceDirection || '-' }}
                    数量 {{ formatFmsQuantity(item.node.endingQuantity, item.node.quantityAccounting) }}
                    单价 {{ formatFmsMoney(item.node.endingUnitPrice) }}
                    金额 {{ formatFmsMoney(getEndingAmount(item.node)) }}
                  </text>
                </view>
              </view>
            </template>

            <!-- 空状态 -->
            <view v-else class="rounded-12rpx bg-white py-96rpx shadow-sm">
              <wd-empty icon="content" tip="暂无数量金额总账数据" />
            </view>
          </view>
          <view class="h-40rpx" />
        </scroll-view>
      </template>

      <!-- 无可用账套引导 -->
      <AccountSetGuide />
    </template>
  </view>
</template>

<script lang="ts" setup>
import type { LedgerQuantityGeneral } from '@/api/fms/ledger'
import { getLedgerQuantityGeneralList } from '@/api/fms/ledger'
import { useAccess } from '@/hooks/useAccess'
import AccountSetGuide from '@/pages-fms/components/account-set/guide.vue'
import AccountSetSwitch from '@/pages-fms/components/account-set/switch.vue'
import SearchForm from '@/pages-fms/ledger/components/search-form.vue'
import { useFmsStore } from '@/pages-fms/store/fms'
import { FMS_SUBJECT_LEVEL_MAX, FMS_SUBJECT_LEVEL_MIN } from '@/pages-fms/utils/constants'
import { formatFmsMoney, formatFmsQuantity } from '@/pages-fms/utils/format'
import { navigateBackPlus } from '@/utils'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const fmsStore = useFmsStore()
const loading = ref(false) // 账簿加载状态
const list = ref<LedgerQuantityGeneral[]>([]) // 数量金额总账树
const queryParams = reactive({ // 查询参数
  startMonth: '',
  endMonth: '',
  startSubjectId: undefined as number | undefined,
  endSubjectId: undefined as number | undefined,
  minLevel: undefined as number | undefined,
  maxLevel: undefined as number | undefined,
})

const flatList = computed(() => { // 平铺展示的科目列表（对齐 PC 全量展开，按层级缩进）
  const result: { node: LedgerQuantityGeneral, depth: number }[] = []
  const walk = (nodes: LedgerQuantityGeneral[], depth: number) => {
    for (const node of nodes) {
      result.push({ node, depth })
      if (node.children?.length) {
        walk(node.children, depth + 1)
      }
    }
  }
  walk(list.value, 0)
  return result
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 获得期初余额金额 */
function getOpeningAmount(node: LedgerQuantityGeneral) {
  return node.openingDebitAmount || node.openingCreditAmount
}

/** 获得期末余额金额 */
function getEndingAmount(node: LedgerQuantityGeneral) {
  return node.endingDebitAmount || node.endingCreditAmount
}

/** 查询数量金额总账 */
async function getList() {
  const accountSetId = fmsStore.accountSet?.id
  if (!accountSetId || !queryParams.startMonth || !queryParams.endMonth) {
    list.value = []
    return
  }
  loading.value = true
  try {
    list.value = await getLedgerQuantityGeneralList({
      accountSetId,
      startMonth: queryParams.startMonth,
      endMonth: queryParams.endMonth,
      startSubjectId: queryParams.startSubjectId,
      endSubjectId: queryParams.endSubjectId,
      minLevel: queryParams.minLevel,
      maxLevel: queryParams.maxLevel,
    })
  } finally {
    loading.value = false
  }
}

/** 搜索按钮操作 */
function handleQuery(data: Record<string, any>) {
  queryParams.startMonth = data.startMonth
  queryParams.endMonth = data.endMonth
  queryParams.startSubjectId = data.startSubjectId
  queryParams.endSubjectId = data.endSubjectId
  queryParams.minLevel = data.minLevel
  queryParams.maxLevel = data.maxLevel
  getList()
}

/** 账套切换后清空列表，等待搜索组件重新触发查询 */
function handleAccountSetChange() {
  list.value = []
}

/** 初始化 */
onMounted(async () => {
  await fmsStore.loadAccountSetList()
})
</script>
