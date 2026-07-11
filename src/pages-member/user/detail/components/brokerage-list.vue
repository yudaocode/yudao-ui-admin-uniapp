<template>
  <view class="min-h-0 flex flex-1 flex-col">
    <!-- 搜索组件 -->
    <BrokerageSearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 推广用户列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无推广用户"
      @query="queryList"
    >
      <view class="p-24rpx pb-160rpx">
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
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { TradeBrokerageUser } from '@/api/mall/trade/brokerage/user'
import { ref, watch } from 'vue'
import { getTradeBrokerageUserPage } from '@/api/mall/trade/brokerage/user'
import { formatDateTime } from '@/utils/date'
import BrokerageSearchForm from './brokerage-search-form.vue'

const props = defineProps<{
  bindUserId?: number | any
}>()

const list = ref<TradeBrokerageUser[]>([]) // 列表数据
const pagingRef = ref<ZPagingRef<TradeBrokerageUser>>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数

/** 查询推广用户 */
async function queryList(pageNo: number, pageSize: number) {
  if (!props.bindUserId) {
    pagingRef.value?.complete([])
    return
  }
  try {
    const data = await getTradeBrokerageUserPage({
      ...queryParams.value,
      bindUserId: Number(props.bindUserId),
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

/** 监听会员变化，重新加载列表 */
watch(
  () => props.bindUserId,
  () => reload(),
)
</script>
