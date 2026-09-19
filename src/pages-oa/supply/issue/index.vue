<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="领用发放"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 发放明细列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无发放明细"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx rounded-12rpx bg-white p-24rpx"
        >
          <view class="mb-16rpx flex items-center justify-between gap-12rpx">
            <text class="line-clamp-1 min-w-0 flex-1 text-32rpx text-[#333] font-semibold">{{ item.itemName || '-' }}</text>
            <dict-tag :type="DICT_TYPE.OA_SUPPLY_ITEM_STATUS" :value="item.status" />
          </view>
          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">申请单号：</text>
            <text class="line-clamp-1 min-w-0 flex-1">{{ item.no || '-' }}</text>
          </view>
          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">申请人：</text>
            <text>{{ item.creatorName || '-' }}</text>
            <text v-if="item.deptName" class="ml-16rpx text-[#999]">{{ item.deptName }}</text>
          </view>
          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <dict-tag :type="DICT_TYPE.OA_SUPPLY_USE_TYPE" :value="item.useType" />
            <dict-tag class="ml-16rpx" :type="DICT_TYPE.OA_SUPPLY_MANAGE_TYPE" :value="item.manageType" />
            <text v-if="item.model" class="ml-16rpx text-[#999]">{{ item.model }}</text>
          </view>
          <view class="flex items-center justify-between">
            <text class="text-26rpx text-[#666]">
              申请 {{ item.applyQuantity ?? 0 }} · 实发 {{ item.issuedQuantity ?? 0 }} · 已归还 {{ item.returnedQuantity ?? 0 }}
            </text>
            <view class="flex items-center gap-16rpx">
              <wd-button
                v-if="item.status === OA_SUPPLY_ISSUE_STATUS.PENDING_ISSUE && hasAccessByCodes(['oa:supply-issue:issue'])"
                size="small" type="primary" @click="handleIssue(item)"
              >
                发放
              </wd-button>
              <wd-button
                v-if="item.status === OA_SUPPLY_ISSUE_STATUS.PENDING_RETURN && hasAccessByCodes(['oa:supply-issue:return'])"
                size="small" type="warning" @click="handleReturn(item)"
              >
                归还
              </wd-button>
            </view>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 发放弹窗 -->
    <IssueForm ref="issueFormRef" @success="reload" />
    <!-- 归还弹窗 -->
    <ReturnForm ref="returnFormRef" @success="reload" />
  </view>
</template>

<script lang="ts" setup>
import type { SupplyIssue } from '@/api/oa/supply/issue'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { getSupplyIssuePage } from '@/api/oa/supply/issue'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import IssueForm from './components/issue-form.vue'
import ReturnForm from './components/return-form.vue'
import SearchForm from './components/search-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

/** 发放明细状态：与字典 oa_supply_item_status 一致 */
const OA_SUPPLY_ISSUE_STATUS = { PENDING_ISSUE: 0, PENDING_RETURN: 2 } as const

const { hasAccessByCodes } = useAccess()
const list = ref<SupplyIssue[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数
const issueFormRef = ref() // 发放弹窗引用
const returnFormRef = ref() // 归还弹窗引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询发放明细列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getSupplyIssuePage({
      ...queryParams.value,
      pageNo,
      pageSize,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 搜索按钮操作 */
function handleQuery(data?: Record<string, any>) {
  queryParams.value = { ...data }
  reload()
}

/** 重置按钮操作 */
function handleReset() {
  handleQuery()
}

/** 重新加载 */
function reload() {
  pagingRef.value?.reload()
}

/** 打开发放弹窗 */
function handleIssue(item: SupplyIssue) {
  issueFormRef.value?.open(item)
}

/** 打开归还弹窗 */
function handleReturn(item: SupplyIssue) {
  returnFormRef.value?.open(item)
}

/** 初始化 */
onMounted(() => {
  uni.$on('oa:supply-issue:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('oa:supply-issue:reload', reload)
})
</script>
