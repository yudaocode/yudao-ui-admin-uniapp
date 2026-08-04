<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="薪资组"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 薪资组列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无薪资组"
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
          <view class="mb-12rpx text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">计薪标准：</text>{{ item.salaryStandard ?? 0 }} 天/月
          </view>
          <view class="mb-12rpx text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">计税规则：</text>{{ item.taxRuleName || '-' }}
          </view>
          <view class="mb-12rpx text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">调薪规则：</text>{{ item.changeRule || '-' }}
          </view>
          <view class="text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">适用范围：</text>{{ formatSalaryGroupScope(item) }}
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['hrm:salary:group:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { SalaryGroup } from '@/api/hrm/salary/config/group'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { getSalaryGroupPage } from '@/api/hrm/salary/config/group'
import { useAccess } from '@/hooks/useAccess'
import { formatSalaryGroupScope } from '@/pages-hrm/utils/format'
import { navigateBackPlus } from '@/utils'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const list = ref<SalaryGroup[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询薪资组列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getSalaryGroupPage({
      pageNo,
      pageSize,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 重新加载 */
function reload() {
  pagingRef.value?.reload()
}

/** 新增薪资组 */
function handleAdd() {
  uni.navigateTo({
    url: '/pages-hrm/salary/config/group/form/index',
  })
}

/** 查看详情 */
function handleDetail(item: SalaryGroup) {
  uni.navigateTo({
    url: `/pages-hrm/salary/config/group/detail/index?id=${item.id}`,
  })
}

/** 初始化 */
onMounted(() => {
  uni.$on('hrm:salary:group:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('hrm:salary:group:reload', reload)
})
</script>
