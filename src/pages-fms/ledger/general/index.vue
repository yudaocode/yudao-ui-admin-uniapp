<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="总账"
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
          :default-min-level="1"
          :default-max-level="1"
          search-placeholder="搜索总账"
          @search="handleQuery"
          @reset="handleQuery"
        />

        <!-- 总账列表 -->
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

            <template v-else-if="groups.length">
              <view
                v-for="group in groups"
                :key="group.subjectId"
                class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm"
              >
                <!-- 科目标题，点击下钻明细账 -->
                <view class="flex items-center justify-between gap-16rpx border-0 border-b border-[#eee] border-b-solid px-24rpx py-20rpx">
                  <text class="min-w-0 flex-1 truncate text-30rpx text-[#333] font-semibold">
                    {{ group.subjectCode }} {{ group.subjectName }}
                  </text>
                  <view
                    v-if="hasAccessByCodes(['fms:ledger:detail:query'])"
                    class="flex flex-shrink-0 items-center"
                    @click="openDetail(group)"
                  >
                    <text class="text-24rpx text-[#1677ff]">明细账</text>
                    <wd-icon name="arrow-right" size="24rpx" color="#1677ff" />
                  </view>
                </view>
                <!-- 期间汇总行 -->
                <view
                  v-for="(row, index) in group.rows"
                  :key="index"
                  class="border-0 border-b border-[#f5f5f5] border-b-solid px-24rpx py-16rpx"
                >
                  <view class="mb-4rpx text-26rpx text-[#333] font-semibold">
                    {{ row.period }} {{ row.digest }}
                  </view>
                  <view class="flex flex-wrap items-center gap-x-24rpx gap-y-4rpx text-26rpx text-[#666]">
                    <text>借方 {{ formatFmsMoney(row.debitAmount) }}</text>
                    <text>贷方 {{ formatFmsMoney(row.creditAmount) }}</text>
                    <text>余额 {{ formatFmsSubjectBalance(row.balance, row.balanceDirection) }}</text>
                  </view>
                </view>
              </view>
            </template>

            <!-- 空状态 -->
            <view v-else class="rounded-12rpx bg-white py-96rpx shadow-sm">
              <wd-empty icon="content" tip="暂无总账数据" />
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
import type { LedgerGeneral } from '@/api/fms/ledger'
import { getLedgerGeneralList } from '@/api/fms/ledger'
import { useAccess } from '@/hooks/useAccess'
import AccountSetGuide from '@/pages-fms/components/account-set/guide.vue'
import AccountSetSwitch from '@/pages-fms/components/account-set/switch.vue'
import SearchForm from '@/pages-fms/ledger/components/search-form.vue'
import { useFmsStore } from '@/pages-fms/store/fms'
import { formatFmsMoney, formatFmsSubjectBalance } from '@/pages-fms/utils/format'
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
const list = ref<LedgerGeneral[]>([]) // 总账行列表
const queryParams = reactive({ // 查询参数
  startMonth: '',
  endMonth: '',
  startSubjectId: undefined as number | undefined,
  endSubjectId: undefined as number | undefined,
  minLevel: undefined as number | undefined,
  maxLevel: undefined as number | undefined,
})

const groups = computed(() => { // 按科目分组的总账列表（后端按科目连续返回，分组承接 PC 合并单元格语义）
  const result: { subjectId: number, subjectCode: string, subjectName: string, rows: LedgerGeneral[] }[] = []
  for (const row of list.value) {
    let group = result[result.length - 1]
    if (!group || group.subjectId !== row.subjectId) {
      group = { subjectId: row.subjectId, subjectCode: row.subjectCode, subjectName: row.subjectName, rows: [] }
      result.push(group)
    }
    group.rows.push(row)
  }
  return result
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询总账 */
async function getList() {
  const accountSetId = fmsStore.accountSet?.id
  if (!accountSetId || !queryParams.startMonth || !queryParams.endMonth) {
    list.value = []
    return
  }
  loading.value = true
  try {
    list.value = await getLedgerGeneralList({
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

/** 打开科目明细账 */
function openDetail(group: { subjectId: number }) {
  uni.navigateTo({
    url: `/pages-fms/ledger/detail/index?subjectId=${group.subjectId}&startMonth=${queryParams.startMonth}&endMonth=${queryParams.endMonth}`,
  })
}

/** 初始化 */
onMounted(async () => {
  await fmsStore.loadAccountSetList()
})
</script>
