<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="辅助核算余额表"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <template v-if="hasAccessByCodes(['fms:ledger:subject-balance:query'])">
      <template v-if="fmsStore.accountSet">
        <!-- 账套切换 -->
        <view class="p-24rpx pb-0">
          <AccountSetSwitch @change="handleAccountSetChange" />
        </view>

        <!-- 搜索组件 -->
        <!-- TODO @AI：间隙；看看别的模块，有没类似的情况 -->
        <SearchForm
          show-subject
          subject-all-option
          show-auxiliary
          auxiliary-item-all
          search-placeholder="搜索辅助核算余额表"
          @search="handleQuery"
          @reset="handleQuery"
        />

        <!-- 核算项目余额列表 -->
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

            <template v-else-if="list.length">
              <view
                v-for="item in list"
                :key="item.auxiliaryItemId"
                class="mb-20rpx rounded-12rpx bg-white p-24rpx shadow-sm"
              >
                <!-- 项目标题 -->
                <view class="mb-16rpx truncate text-30rpx text-[#333] font-semibold">
                  {{ item.code }} {{ item.name }}
                </view>
                <!-- 余额金额 -->
                <view class="grid grid-cols-2 gap-x-32rpx gap-y-8rpx text-26rpx">
                  <view class="flex items-center justify-between">
                    <text class="text-[#999]">期初借方</text>
                    <text class="text-[#333]">{{ formatFmsAmount(item.openingDebitAmount) }}</text>
                  </view>
                  <view class="flex items-center justify-between">
                    <text class="text-[#999]">期初贷方</text>
                    <text class="text-[#333]">{{ formatFmsAmount(item.openingCreditAmount) }}</text>
                  </view>
                  <view class="flex items-center justify-between">
                    <text class="text-[#999]">本期借方</text>
                    <text class="text-[#333]">{{ formatFmsAmount(item.periodDebitAmount) }}</text>
                  </view>
                  <view class="flex items-center justify-between">
                    <text class="text-[#999]">本期贷方</text>
                    <text class="text-[#333]">{{ formatFmsAmount(item.periodCreditAmount) }}</text>
                  </view>
                  <view class="flex items-center justify-between">
                    <text class="text-[#999]">累计借方</text>
                    <text class="text-[#333]">{{ formatFmsAmount(item.yearDebitAmount) }}</text>
                  </view>
                  <view class="flex items-center justify-between">
                    <text class="text-[#999]">累计贷方</text>
                    <text class="text-[#333]">{{ formatFmsAmount(item.yearCreditAmount) }}</text>
                  </view>
                  <view class="flex items-center justify-between">
                    <text class="text-[#999]">期末借方</text>
                    <text class="text-[#333]">{{ formatFmsAmount(item.endingDebitAmount) }}</text>
                  </view>
                  <view class="flex items-center justify-between">
                    <text class="text-[#999]">期末贷方</text>
                    <text class="text-[#333]">{{ formatFmsAmount(item.endingCreditAmount) }}</text>
                  </view>
                </view>
              </view>
            </template>

            <!-- 空状态 -->
            <view v-else class="rounded-12rpx bg-white py-96rpx shadow-sm">
              <wd-empty
                icon="content"
                :tip="queryParams.auxiliaryTypeId ? '暂无核算项目余额数据' : '暂无辅助核算类别'"
              />
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
import type { LedgerAuxiliaryBalance } from '@/api/fms/ledger'
import { getLedgerAuxiliaryBalanceList } from '@/api/fms/ledger'
import { useAccess } from '@/hooks/useAccess'
import AccountSetGuide from '@/pages-fms/components/account-set/guide.vue'
import AccountSetSwitch from '@/pages-fms/components/account-set/switch.vue'
import SearchForm from '@/pages-fms/ledger/components/search-form.vue'
import { useFmsStore } from '@/pages-fms/store/fms'
import { formatFmsAmount } from '@/pages-fms/utils/format'
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
const list = ref<LedgerAuxiliaryBalance[]>([]) // 核算项目余额列表
const queryParams = reactive({ // 查询参数
  startMonth: '',
  endMonth: '',
  auxiliaryTypeId: undefined as number | undefined,
  auxiliaryItemId: undefined as number | undefined,
  subjectId: undefined as number | undefined,
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询核算项目余额表 */
async function getList() {
  const accountSetId = fmsStore.accountSet?.id
  if (!accountSetId || !queryParams.auxiliaryTypeId || !queryParams.startMonth || !queryParams.endMonth) {
    list.value = []
    return
  }
  loading.value = true
  try {
    list.value = await getLedgerAuxiliaryBalanceList({
      accountSetId,
      startMonth: queryParams.startMonth,
      endMonth: queryParams.endMonth,
      auxiliaryTypeId: queryParams.auxiliaryTypeId,
      auxiliaryItemId: queryParams.auxiliaryItemId,
      subjectId: queryParams.subjectId,
    })
  } finally {
    loading.value = false
  }
}

/** 搜索按钮操作 */
function handleQuery(data: Record<string, any>) {
  queryParams.startMonth = data.startMonth
  queryParams.endMonth = data.endMonth
  queryParams.auxiliaryTypeId = data.auxiliaryTypeId
  queryParams.auxiliaryItemId = data.auxiliaryItemId
  queryParams.subjectId = data.subjectId
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
