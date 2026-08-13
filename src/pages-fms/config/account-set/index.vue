<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="账套管理"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 账套列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :refresher-enabled="true"
      empty-view-text="暂无账套，请点击右下角新增"
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
              {{ item.companyName }}
            </view>
            <view class="flex flex-shrink-0 gap-8rpx">
              <wd-tag v-if="item.defaultStatus" type="primary" plain>
                默认
              </wd-tag>
              <wd-tag :type="item.initialized ? 'success' : 'info'" plain>
                {{ item.initialized ? '已启用' : '待初始化' }}
              </wd-tag>
            </view>
          </view>
          <view class="mb-12rpx text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">公司编码：</text>{{ item.companyCode || '-' }}
          </view>
          <view class="mb-12rpx text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">联系人：</text>
            {{ [item.contactName, item.mobile].filter(Boolean).join(' / ') || '-' }}
          </view>
          <view v-if="item.initialized" class="mb-12rpx text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">启用期间：</text>{{ formatFmsStartTime(item.startTime) || '-' }}
          </view>
          <view class="text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">创建时间：</text>{{ formatDateTime(item.createTime) || '-' }}
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['fms:config:account-set:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { AccountSet } from '@/api/fms/config/account-set'
import { onUnload } from '@dcloudio/uni-app'
import { useAccess } from '@/hooks/useAccess'
import { useFmsStore } from '@/pages-fms/store/fms'
import { formatFmsStartTime } from '@/pages-fms/utils/format'
import { navigateBackPlus } from '@/utils'
import { formatDateTime } from '@/utils/date'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const fmsStore = useFmsStore()
const list = ref<AccountSet[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询账套列表（当前用户可访问的账套，不分页） */
async function queryList() {
  try {
    const data = await fmsStore.loadAccountSetList(true)
    pagingRef.value?.complete([...data])
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 重新加载 */
function reload() {
  pagingRef.value?.reload()
}

/** 新增账套 */
function handleAdd() {
  uni.navigateTo({ url: '/pages-fms/config/account-set/form/index' })
}

/** 查看详情 */
function handleDetail(item: AccountSet) {
  uni.navigateTo({ url: `/pages-fms/config/account-set/detail/index?id=${item.id}` })
}

/** 初始化 */
onMounted(() => {
  uni.$on('fms:config:account-set:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('fms:config:account-set:reload', reload)
})
</script>
