<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="考核指标模板"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 模板列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无考核指标模板"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
          @click="handleDetail(item)"
        >
          <view class="mb-16rpx truncate text-32rpx text-[#333] font-semibold">
            {{ item.name }}
          </view>
          <view v-if="item.illustrate" class="mb-12rpx text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">说明：</text>
            <text class="line-clamp-2">{{ item.illustrate }}</text>
          </view>
          <view class="mb-12rpx text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">维度 / 指标：</text>
            {{ item.dimensionCount ?? 0 }} / {{ item.quotaCount ?? 0 }}
          </view>
          <view class="mb-12rpx text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">总分：</text>{{ item.upperLimitScore ?? '-' }}
          </view>
          <view class="mb-12rpx text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">创建人：</text>{{ item.creatorName || '-' }}
          </view>
          <view class="text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">最近更新：</text>{{ formatDateTime(item.updateTime) || '-' }}
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['hrm:performance:assessment-template:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { AssessmentTemplate } from '@/api/hrm/performance/config/assessment-template'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { getPerformanceAssessmentTemplatePage } from '@/api/hrm/performance/config/assessment-template'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { formatDateTime } from '@/utils/date'
import SearchForm from './components/search-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const list = ref<AssessmentTemplate[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询考核指标模板列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getPerformanceAssessmentTemplatePage({
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

/** 新增考核指标模板 */
function handleAdd() {
  uni.navigateTo({
    url: '/pages-hrm/performance/config/assessment-template/form/index',
  })
}

/** 查看详情 */
function handleDetail(item: AssessmentTemplate) {
  uni.navigateTo({
    url: `/pages-hrm/performance/config/assessment-template/detail/index?id=${item.id}`,
  })
}

/** 初始化 */
onMounted(() => {
  uni.$on('hrm:performance:assessment-template:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('hrm:performance:assessment-template:reload', reload)
})
</script>
