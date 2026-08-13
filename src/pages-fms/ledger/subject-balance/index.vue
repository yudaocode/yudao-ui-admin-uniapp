<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="科目余额表"
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
          show-subject-range
          :default-min-level="1"
          :default-max-level="FMS_SUBJECT_LEVEL_MAX"
          search-placeholder="搜索科目余额表"
          @search="handleQuery"
          @reset="handleQuery"
        />

        <!-- 科目余额列表 -->
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

            <template v-else-if="flatNodes.length">
              <view
                v-for="item in flatNodes"
                :key="item.node.nodeKey"
                class="mb-20rpx rounded-12rpx bg-white p-24rpx shadow-sm"
                :style="{ marginLeft: `${item.depth * 32}rpx` }"
              >
                <!-- 节点标题：科目节点可下钻明细账，含下级节点可展开 -->
                <view class="mb-16rpx flex items-center justify-between gap-12rpx">
                  <view
                    class="min-w-0 flex-1 truncate text-30rpx font-semibold"
                    :class="canOpenDetail(item.node) ? 'text-[#1677ff]' : 'text-[#333]'"
                    @click="handleNodeClick(item.node)"
                  >
                    {{ item.node.subjectCode }} {{ item.node.subjectName }}
                  </view>
                  <view
                    v-if="item.hasChildren"
                    class="flex flex-shrink-0 items-center"
                    @click="toggleNode(item.node.nodeKey)"
                  >
                    <text class="text-24rpx text-[#1677ff]">{{ item.expanded ? '收起' : '展开' }}</text>
                    <wd-icon :name="item.expanded ? 'arrow-up' : 'arrow-down'" size="24rpx" color="#1677ff" />
                  </view>
                </view>
                <!-- 余额金额 -->
                <view class="grid grid-cols-2 gap-x-32rpx gap-y-8rpx text-26rpx">
                  <view class="flex items-center justify-between">
                    <text class="text-[#999]">期初借方</text>
                    <text class="text-[#333]">{{ formatFmsAmount(item.node.openingDebitAmount) }}</text>
                  </view>
                  <view class="flex items-center justify-between">
                    <text class="text-[#999]">期初贷方</text>
                    <text class="text-[#333]">{{ formatFmsAmount(item.node.openingCreditAmount) }}</text>
                  </view>
                  <view class="flex items-center justify-between">
                    <text class="text-[#999]">本期借方</text>
                    <text class="text-[#333]">{{ formatFmsAmount(item.node.periodDebitAmount) }}</text>
                  </view>
                  <view class="flex items-center justify-between">
                    <text class="text-[#999]">本期贷方</text>
                    <text class="text-[#333]">{{ formatFmsAmount(item.node.periodCreditAmount) }}</text>
                  </view>
                  <view class="flex items-center justify-between">
                    <text class="text-[#999]">累计借方</text>
                    <text class="text-[#333]">{{ formatFmsAmount(item.node.yearDebitAmount) }}</text>
                  </view>
                  <view class="flex items-center justify-between">
                    <text class="text-[#999]">累计贷方</text>
                    <text class="text-[#333]">{{ formatFmsAmount(item.node.yearCreditAmount) }}</text>
                  </view>
                  <view class="flex items-center justify-between">
                    <text class="text-[#999]">期末借方</text>
                    <text class="text-[#333]">{{ formatFmsAmount(item.node.endingDebitAmount) }}</text>
                  </view>
                  <view class="flex items-center justify-between">
                    <text class="text-[#999]">期末贷方</text>
                    <text class="text-[#333]">{{ formatFmsAmount(item.node.endingCreditAmount) }}</text>
                  </view>
                </view>
              </view>
            </template>

            <!-- 空状态 -->
            <view v-else class="rounded-12rpx bg-white py-96rpx shadow-sm">
              <wd-empty icon="content" tip="暂无科目余额数据" />
            </view>
          </view>
          <view class="h-40rpx" />
        </scroll-view>
      </template>

      <!-- 无可用账套引导 -->
      <AccountSetGuide v-else-if="fmsStore.accountSetListLoaded" />
    </template>
  </view>
</template>

<script lang="ts" setup>
import type { LedgerSubjectBalance } from '@/api/fms/ledger'
import { getLedgerSubjectBalanceList } from '@/api/fms/ledger'
import { useAccess } from '@/hooks/useAccess'
import AccountSetGuide from '@/pages-fms/components/account-set/guide.vue'
import AccountSetSwitch from '@/pages-fms/components/account-set/switch.vue'
import SearchForm from '@/pages-fms/ledger/components/search-form.vue'
import { useFmsStore } from '@/pages-fms/store/fms'
import { FMS_SUBJECT_LEVEL_MAX, FmsSubjectBalanceNodeType } from '@/pages-fms/utils/constants'
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
const list = ref<LedgerSubjectBalance[]>([]) // 科目余额树
const expandedKeys = ref<Set<string>>(new Set()) // 已展开节点键集合
const queryParams = reactive({ // 查询参数
  startMonth: '',
  endMonth: '',
  startSubjectId: undefined as number | undefined,
  endSubjectId: undefined as number | undefined,
  minLevel: undefined as number | undefined,
  maxLevel: undefined as number | undefined,
})

/** 平铺展示的余额节点：默认只展示顶级，展开后按缩进展示下级 */
const flatNodes = computed(() => {
  const result: { node: LedgerSubjectBalance, depth: number, hasChildren: boolean, expanded: boolean }[] = []
  const walk = (nodes: LedgerSubjectBalance[], depth: number) => {
    for (const node of nodes) {
      const hasChildren = (node.children || []).length > 0
      const expanded = expandedKeys.value.has(node.nodeKey)
      result.push({ node, depth, hasChildren, expanded })
      if (hasChildren && expanded) {
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

/** 科目节点是否可下钻明细账 */
function canOpenDetail(node: LedgerSubjectBalance) {
  return node.nodeType === FmsSubjectBalanceNodeType.SUBJECT && hasAccessByCodes(['fms:ledger:detail:query'])
}

/** 节点标题点击：科目节点下钻明细账 */
function handleNodeClick(node: LedgerSubjectBalance) {
  if (!canOpenDetail(node)) {
    return
  }
  uni.navigateTo({
    url: `/pages-fms/ledger/detail/index?subjectId=${node.subjectId}&startMonth=${queryParams.startMonth}&endMonth=${queryParams.endMonth}`,
  })
}

/** 展开或收起节点 */
function toggleNode(nodeKey: string) {
  if (expandedKeys.value.has(nodeKey)) {
    expandedKeys.value.delete(nodeKey)
  } else {
    expandedKeys.value.add(nodeKey)
  }
}

/** 查询科目余额表 */
async function getList() {
  const accountSetId = fmsStore.accountSet?.id
  if (!accountSetId || !queryParams.startMonth || !queryParams.endMonth) {
    list.value = []
    return
  }
  loading.value = true
  try {
    list.value = await getLedgerSubjectBalanceList({
      accountSetId,
      startMonth: queryParams.startMonth,
      endMonth: queryParams.endMonth,
      startSubjectId: queryParams.startSubjectId,
      endSubjectId: queryParams.endSubjectId,
      minLevel: queryParams.minLevel,
      maxLevel: queryParams.maxLevel,
    })
    expandedKeys.value = new Set() // 新查询结果恢复默认折叠
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
