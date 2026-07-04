<template>
  <view>
    <!-- 搜索组件 -->
    <BrokerageSearchForm @search="handleQuery" @reset="handleReset" />
    <scroll-view scroll-y class="min-h-520rpx">
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-20rpx rounded-12rpx bg-white p-24rpx shadow-sm"
        >
          <view class="flex items-center gap-16rpx">
            <wd-img
              v-if="item.avatar"
              :src="item.avatar"
              :width="44"
              :height="44"
              mode="aspectFill"
              round
            />
            <view
              v-else
              class="h-88rpx w-88rpx flex shrink-0 items-center justify-center rounded-full bg-[#1890ff] text-34rpx text-white"
            >
              {{ (item.nickname || '推').charAt(0) }}
            </view>
            <view class="min-w-0 flex-1">
              <view class="mb-8rpx flex items-center justify-between gap-16rpx">
                <view class="min-w-0 flex-1 truncate text-30rpx text-[#333] font-semibold">
                  {{ item.nickname || `用户 ${item.id}` }}
                </view>
                <wd-tag type="primary" variant="plain">
                  {{ item.bindUserId === Number(props.bindUserId) ? '一级' : '二级' }}
                </wd-tag>
              </view>
              <view class="text-24rpx text-[#999]">
                绑定时间：{{ formatDateTime(item.bindUserTime) || '-' }}
              </view>
            </view>
          </view>
        </view>
        <wd-empty v-if="!loading && list.length === 0" icon="content" tip="暂无推广用户" />
        <view v-if="hasMore" class="pb-24rpx">
          <wd-button block variant="plain" :loading="loading" @click="loadMore">
            加载更多
          </wd-button>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script lang="ts" setup>
import type { TradeBrokerageUser } from '@/api/mall/trade/brokerage/user'
import { computed, onMounted, ref, watch } from 'vue'
import { getTradeBrokerageUserPage } from '@/api/mall/trade/brokerage/user'
import { formatDateTime } from '@/utils/date'
import BrokerageSearchForm from './brokerage-search-form.vue'

const props = defineProps<{
  bindUserId?: number | any
}>()

const list = ref<TradeBrokerageUser[]>([]) // 列表数据
const loading = ref(false) // 加载状态
const total = ref(0) // 总条数
const pageNo = ref(1) // 当前页码
const pageSize = 10 // 每页条数
const queryParams = ref<Record<string, any>>({}) // 搜索条件
const hasMore = computed(() => list.value.length < total.value)

/** 查询推广用户 */
async function getList(reset = true) {
  if (!props.bindUserId) {
    list.value = []
    total.value = 0
    return
  }
  loading.value = true
  try {
    const currentPageNo = reset ? 1 : pageNo.value + 1
    const data = await getTradeBrokerageUserPage({
      ...queryParams.value,
      bindUserId: Number(props.bindUserId),
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

/** 搜索按钮操作 */
function handleQuery(data?: Record<string, any>) {
  queryParams.value = { ...data }
  getList()
}

/** 重置按钮操作 */
function handleReset() {
  handleQuery()
}

watch(
  () => props.bindUserId,
  () => {
    getList()
  },
)

/** 初始化 */
onMounted(() => {
  getList()
})
</script>
