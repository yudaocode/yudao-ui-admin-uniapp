<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="数据源配置管理"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 数据源配置列表 -->
    <view class="p-24rpx">
      <view
        v-for="item in list"
        :key="item.id"
        class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm"
        @click="handleDetail(item)"
      >
        <view class="p-24rpx">
          <view class="mb-16rpx flex items-center justify-between">
            <view class="text-32rpx text-[#333] font-semibold">
              {{ item.name }}
            </view>
            <view v-if="item.id === 0" class="rounded-4rpx bg-[#e6f7ff] px-12rpx py-4rpx text-24rpx text-[#1890ff]">
              主数据源
            </view>
          </view>
          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">主键编号：</text>
            <text class="min-w-0 flex-1 truncate">{{ item.id }}</text>
          </view>
          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">数据源连接：</text>
            <text class="min-w-0 flex-1 truncate">{{ item.url }}</text>
          </view>
          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">用户名：</text>
            <text>{{ item.username }}</text>
          </view>
          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">创建时间：</text>
            <text>{{ formatDateTime(item.createTime) }}</text>
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <view v-if="!loading && list.length === 0" class="py-100rpx text-center">
        <wd-status-tip image="content" tip="暂无数据源配置数据" />
      </view>
    </view>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['infra:data-source-config:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { DataSourceConfig } from '@/api/infra/data-source-config'
import { onMounted, ref } from 'vue'
import { useToast } from 'wot-design-uni'
import { getDataSourceConfigList } from '@/api/infra/data-source-config'
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
const toast = useToast()
const list = ref<DataSourceConfig[]>([])
const loading = ref(false)

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询数据源配置列表 */
async function getList() {
  loading.value = true
  try {
    toast.loading('加载中...')
    list.value = await getDataSourceConfigList()
  } finally {
    loading.value = false
    toast.close()
  }
}

/** 新增数据源配置 */
function handleAdd() {
  uni.navigateTo({
    url: '/pages-infra/data-source-config/form/index',
  })
}

/** 查看详情 */
function handleDetail(item: DataSourceConfig) {
  uni.navigateTo({
    url: `/pages-infra/data-source-config/detail/index?id=${item.id}`,
  })
}

/** 初始化 */
onMounted(() => {
  getList()
})
</script>

<style lang="scss" scoped>
</style>
