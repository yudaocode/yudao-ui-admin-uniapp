<template>
  <scroll-view scroll-y class="min-h-520rpx">
    <view class="p-24rpx">
      <view
        v-for="item in list"
        :key="item.id"
        class="mb-20rpx rounded-12rpx bg-white p-24rpx shadow-sm"
      >
        <view class="flex gap-16rpx">
          <wd-img
            v-if="item.picUrl"
            :src="item.picUrl"
            :width="56"
            :height="56"
            mode="aspectFill"
            radius="8rpx"
          />
          <view class="min-w-0 flex-1">
            <view class="mb-12rpx flex items-center justify-between gap-16rpx">
              <view class="min-w-0 flex-1 truncate text-30rpx text-[#333] font-semibold">
                {{ item.name || `商品 ${item.spuId || '-'}` }}
              </view>
              <dict-tag :type="DICT_TYPE.PRODUCT_SPU_STATUS" :value="item.status" />
            </view>
            <view class="mb-12rpx flex items-center text-26rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">商品售价：</text>
              <text>{{ formatAmount(item.price) }}</text>
            </view>
            <view class="mb-12rpx flex items-center text-26rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">销量：</text>
              <text>{{ item.salesCount ?? 0 }}</text>
            </view>
            <view class="text-24rpx text-[#999]">
              {{ formatDateTime(item.createTime) || '-' }}
            </view>
          </view>
        </view>
      </view>
      <wd-empty v-if="!loading && list.length === 0" icon="content" tip="暂无收藏记录" />
      <view v-if="hasMore" class="pb-24rpx">
        <wd-button block variant="plain" :loading="loading" @click="loadMore">
          加载更多
        </wd-button>
      </view>
    </view>
  </scroll-view>
</template>

<script lang="ts" setup>
import type { ProductFavorite } from '@/api/mall/product/favorite'
import { computed, onMounted, ref, watch } from 'vue'
import { getProductFavoritePage } from '@/api/mall/product/favorite'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{
  userId?: number | any
}>()

const list = ref<ProductFavorite[]>([]) // 列表数据
const loading = ref(false) // 加载状态
const total = ref(0) // 总条数
const pageNo = ref(1) // 当前页码
const pageSize = 10 // 每页条数
const hasMore = computed(() => list.value.length < total.value)

/** 金额分转元展示 */
function formatAmount(value?: number | string) {
  return `￥${(Number(value || 0) / 100).toFixed(2)}`
}

/** 查询收藏记录 */
async function getList(reset = true) {
  if (!props.userId) {
    list.value = []
    total.value = 0
    return
  }
  loading.value = true
  try {
    const currentPageNo = reset ? 1 : pageNo.value + 1
    const data = await getProductFavoritePage({
      userId: Number(props.userId),
      pageNo: currentPageNo,
      pageSize,
    })
    list.value = reset ? data.list : [...list.value, ...data.list]
    total.value = data.total
    pageNo.value = currentPageNo
  } finally {
    loading.value = false
  }
}

/** 加载更多 */
function loadMore() {
  getList(false)
}

watch(
  () => props.userId,
  () => {
    getList()
  },
)

/** 初始化 */
onMounted(() => {
  getList()
})
</script>
