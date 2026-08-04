<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="社保方案管理"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 社保方案列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="50"
      :refresher-enabled="true"
      :auto="true"
      :hide-no-more-by-limit="0"
      empty-view-text="暂无社保方案"
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
            <text class="mr-8rpx text-[#999]">参保城市：</text>{{ item.areaName || '-' }}
          </view>
          <view class="mb-12rpx text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">个人社保：</text>{{ formatHrmMoney(item.personalInsuranceAmount) }}
            <text class="mx-8rpx text-[#ddd]">|</text>
            <text class="mr-8rpx text-[#999]">公司社保：</text>{{ formatHrmMoney(item.corporateInsuranceAmount) }}
          </view>
          <view class="mb-12rpx text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">个人公积金：</text>{{ formatHrmMoney(item.personalProvidentFundAmount) }}
            <text class="mx-8rpx text-[#ddd]">|</text>
            <text class="mr-8rpx text-[#999]">公司公积金：</text>{{ formatHrmMoney(item.corporateProvidentFundAmount) }}
          </view>
          <view class="text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">使用人数：</text>{{ item.useCount ?? 0 }}
            <text class="mx-8rpx text-[#ddd]">|</text>
            <text class="mr-8rpx text-[#999]">历史月记录：</text>{{ item.monthRecordCount ?? 0 }}
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['hrm:insurance:scheme:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { InsuranceScheme } from '@/api/hrm/insurance/scheme'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { getInsuranceSchemeList } from '@/api/hrm/insurance/scheme'
import { useAccess } from '@/hooks/useAccess'
import { formatHrmMoney } from '@/pages-hrm/utils/format'
import { navigateBackPlus } from '@/utils'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const list = ref<InsuranceScheme[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询社保方案列表 */
async function queryList() {
  try {
    const data = await getInsuranceSchemeList()
    pagingRef.value?.completeByTotal(data, data.length)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 重新加载 */
function reload() {
  pagingRef.value?.reload()
}

/** 新增社保方案 */
function handleAdd() {
  uni.navigateTo({
    url: '/pages-hrm/insurance/scheme/form/index',
  })
}

/** 查看详情 */
function handleDetail(item: InsuranceScheme) {
  uni.navigateTo({
    url: `/pages-hrm/insurance/scheme/detail/index?id=${item.id}`,
  })
}

/** 初始化 */
onMounted(() => {
  uni.$on('hrm:insurance:scheme:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('hrm:insurance:scheme:reload', reload)
})
</script>
