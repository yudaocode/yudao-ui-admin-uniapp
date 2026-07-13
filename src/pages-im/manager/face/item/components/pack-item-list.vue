<template>
  <view>
    <!-- 表情列表标题 -->
    <view class="mt-20rpx flex items-center justify-between px-24rpx py-16rpx">
      <text class="text-28rpx text-[#333] font-semibold">表情列表（{{ total }}）</text>
      <wd-button
        v-if="hasAccessByCodes(['im:manager:face-pack-item:create'])"
        size="small"
        type="primary"
        variant="plain"
        @click="handleAdd"
      >
        添加表情
      </wd-button>
    </view>
    <!-- 表情分页列表 -->
    <view class="px-24rpx">
      <z-paging
        ref="pagingRef"
        v-model="list"
        :fixed="false"
        height="640rpx"
        :default-page-size="10"
        :refresher-enabled="false"
        :inside-more="true"
        :to-bottom-loading-more-enabled="false"
        loading-more-default-text="点击加载更多"
        loading-more-no-more-text="没有更多表情了"
        empty-view-text="暂无表情"
        @query="queryList"
      >
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-16rpx flex items-center gap-20rpx rounded-12rpx bg-white p-20rpx shadow-sm"
          @click="handleDetail(item)"
        >
          <wd-img
            v-if="item.url"
            :src="item.url"
            width="96rpx"
            height="96rpx"
            radius="12rpx"
            mode="aspectFit"
          />
          <view class="min-w-0 flex-1">
            <view class="line-clamp-1 text-28rpx text-[#333] font-semibold">
              {{ item.name || '未命名' }}
            </view>
            <view class="mt-6rpx text-24rpx text-[#999]">
              {{ item.width }} × {{ item.height }} · 排序 {{ item.sort ?? 0 }}
            </view>
          </view>
          <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="item.status" />
        </view>
      </z-paging>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { ImManagerFacePackItemVO } from '@/api/im/manager/face/item'
import { onMounted, onUnmounted, ref } from 'vue'
import { getManagerFacePackItemPage } from '@/api/im/manager/face/item'
import { useAccess } from '@/hooks/useAccess'
import { DICT_TYPE } from '@/utils/constants'

const props = defineProps<{
  packId?: number | string
}>()

const { hasAccessByCodes } = useAccess()
const list = ref<ImManagerFacePackItemVO[]>([]) // 表情列表
const pagingRef = ref<any>() // 分页组件引用
const total = ref(0) // 表情总数

/** 查询表情列表 */
async function queryList(pageNo: number, pageSize: number) {
  if (!props.packId) {
    pagingRef.value?.completeByTotal([], 0)
    return
  }
  try {
    const data = await getManagerFacePackItemPage({
      packId: Number(props.packId),
      pageNo,
      pageSize,
    })
    total.value = data.total
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 重新加载表情列表 */
function reload() {
  pagingRef.value?.reload()
}

/** 添加表情 */
function handleAdd() {
  uni.navigateTo({ url: `/pages-im/manager/face/item/form/index?packId=${props.packId}` })
}

/** 查看表情详情 */
function handleDetail(item: ImManagerFacePackItemVO) {
  uni.navigateTo({ url: `/pages-im/manager/face/item/detail/index?id=${item.id}` })
}

/** 注册表情变更监听 */
onMounted(() => {
  uni.$on('im:manager:face-pack-item:reload', reload)
})

/** 移除表情变更监听 */
onUnmounted(() => {
  uni.$off('im:manager:face-pack-item:reload', reload)
})
</script>
