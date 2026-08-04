<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="调薪模板"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 调薪模板列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="50"
      :refresher-enabled="true"
      :auto="true"
      :hide-no-more-by-limit="0"
      empty-view-text="暂无调薪模板"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
          @click="handleDetail(item)"
        >
          <view class="mb-16rpx flex items-start justify-between gap-16rpx">
            <view class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
              {{ item.name }}
            </view>
            <view
              class="shrink-0 rounded-6rpx px-12rpx py-4rpx text-22rpx"
              :class="item.defaultStatus ? 'bg-[#f6ffed] text-[#52c41a]' : 'bg-[#f5f5f5] text-[#999]'"
            >
              {{ item.defaultStatus ? '默认' : '非默认' }}
            </view>
          </view>
          <view class="mb-12rpx flex flex-wrap gap-12rpx">
            <view
              v-for="option in (item.options || [])"
              :key="option.code"
              class="rounded-6rpx bg-[#e6f4ff] px-12rpx py-4rpx text-22rpx text-[#1677ff]"
            >
              {{ option.name }}
            </view>
            <text v-if="!(item.options || []).length" class="text-28rpx text-[#999]">暂无调薪项</text>
          </view>
          <view class="text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">创建时间：</text>{{ formatDateTime(item.createTime) || '-' }}
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['hrm:salary:change-template:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { SalaryChangeTemplate } from '@/api/hrm/salary/config/change-template'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { getSalaryChangeTemplateList } from '@/api/hrm/salary/config/change-template'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { formatDateTime } from '@/utils/date'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const list = ref<SalaryChangeTemplate[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询调薪模板列表 */
async function queryList() {
  try {
    const data = await getSalaryChangeTemplateList()
    pagingRef.value?.completeByTotal(data, data.length)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 重新加载 */
function reload() {
  pagingRef.value?.reload()
}

/** 新增调薪模板 */
function handleAdd() {
  uni.navigateTo({
    url: '/pages-hrm/salary/config/change-template/form/index',
  })
}

/** 查看详情 */
function handleDetail(item: SalaryChangeTemplate) {
  uni.navigateTo({
    url: `/pages-hrm/salary/config/change-template/detail/index?id=${item.id}`,
  })
}

/** 初始化 */
onMounted(() => {
  uni.$on('hrm:salary:change-template:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('hrm:salary:change-template:reload', reload)
})
</script>
