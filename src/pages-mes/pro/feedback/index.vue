<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="MES 生产报工管理"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 分页列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无生产报工数据"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm"
          @click="handleDetail(item)"
        >
          <view class="p-24rpx">
            <view class="mb-16rpx flex items-start justify-between gap-16rpx">
              <view class="min-w-0 flex-1">
                <view class="truncate text-32rpx text-[#333] font-semibold">
                  {{ item.code || '-' }}
                </view>
                <view class="mt-6rpx text-24rpx text-[#999]">
                  {{ item.workOrderCode || '-' }} / {{ item.taskCode || '-' }}
                </view>
              </view>
              <dict-tag v-if="item.status != null" :type="DICT_TYPE.MES_PRO_FEEDBACK_STATUS" :value="item.status" />
            </view>
            <view class="mb-14rpx flex flex-wrap gap-12rpx">
              <dict-tag v-if="item.type != null" :type="DICT_TYPE.MES_PRO_FEEDBACK_TYPE" :value="item.type" />
              <wd-tag v-if="item.checkFlag" plain type="warning">
                待质检工序
              </wd-tag>
            </view>
            <view class="text-26rpx text-[#666] space-y-8rpx">
              <view>工作站：{{ item.workstationName || '-' }}</view>
              <view>工序：{{ item.processName || '-' }}</view>
              <view>产品：{{ item.itemCode || '-' }} / {{ item.itemName || '-' }}</view>
              <view>规格：{{ item.itemSpecification || '-' }} / 单位：{{ item.unitMeasureName || '-' }}</view>
              <view>报工数量：{{ item.feedbackQuantity ?? '-' }}</view>
              <view>报工人：{{ item.feedbackUserNickname || '-' }}</view>
              <view>报工时间：{{ formatDateTime(item.feedbackTime) || '-' }}</view>
              <view>审核人：{{ item.approveUserNickname || '-' }}</view>
            </view>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['mes:pro-feedback:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { ProFeedback } from '@/api/mes/pro/feedback'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { getFeedbackPage } from '@/api/mes/pro/feedback'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import SearchForm from './components/search-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const list = ref<ProFeedback[]>([]) // 列表数据
const pagingRef = ref<ZPagingRef<ProFeedback>>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-statistics/mes/home/index')
}

/** 查询列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getFeedbackPage({
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

/** 新增 */
function handleAdd() {
  uni.navigateTo({ url: '/pages-mes/pro/feedback/form/index' })
}

/** 查看详情 */
function handleDetail(item: ProFeedback) {
  uni.navigateTo({ url: `/pages-mes/pro/feedback/detail/index?id=${item.id}` })
}

/** 初始化 */
onMounted(() => {
  uni.$on('mes:pro:feedback:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('mes:pro:feedback:reload', reload)
})
</script>
