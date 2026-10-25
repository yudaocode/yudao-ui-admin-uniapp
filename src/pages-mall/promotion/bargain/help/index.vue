<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="砍价助力"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

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
      empty-view-text="暂无砍价助力"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx overflow-hidden rounded-12rpx bg-white p-24rpx shadow-sm"
        >
          <view class="mb-12rpx flex items-center justify-between gap-16rpx">
            <text class="text-30rpx text-[#333] font-semibold">助力记录 #{{ item.id }}</text>
            <text class="text-30rpx text-[#fa8c16] font-semibold">{{ formatDisplayMoney(item.reducePrice) }}</text>
          </view>
          <view class="flex items-center justify-between text-26rpx text-[#666]">
            <text>砍价记录：{{ item.recordId ?? '-' }}</text>
            <view class="flex items-center gap-8rpx">
              <wd-img v-if="item.avatar" :src="item.avatar" width="40rpx" height="40rpx" radius="50%" mode="aspectFill" />
              <text>{{ item.nickname || `用户 #${item.userId}` }}</text>
            </view>
          </view>
          <view class="mt-8rpx text-24rpx text-[#999]">
            助力时间：{{ formatDateTime(item.createTime) || '-' }}
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import { parseId } from '@/utils/id'

import type { PromotionBargainHelp } from '@/api/mall/promotion/bargain'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { getPromotionBargainHelpPage } from '@/api/mall/promotion/bargain'
import { formatDisplayMoney } from '@/utils/format'
import { navigateBackPlus } from '@/utils'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{ recordId?: number | any }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const list = ref<PromotionBargainHelp[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询砍价助力列表（按砍价记录过滤） */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const query: Record<string, any> = {}
    if (props.recordId != null && props.recordId !== '') {
      query.recordId = parseId(props.recordId) as number
    }
    const data = await getPromotionBargainHelpPage({ ...query, pageNo, pageSize })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 重新加载 */
function reload() {
  pagingRef.value?.reload()
}

/** 初始化 */
onMounted(() => {
  uni.$on('mall:promotion-bargain-help:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('mall:promotion-bargain-help:reload', reload)
})
</script>
