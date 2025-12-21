<template>
  <view>
    <!-- 搜索组件 -->
    <DataSearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 字典数据列表 -->
    <view class="p-24rpx">
      <!-- 当前字典类型提示 -->
      <view v-if="dictType" class="mb-24rpx rounded-12rpx bg-blue-50 p-16rpx text-28rpx text-blue-600">
        当前字典类型：{{ dictType }}
      </view>
      <view v-else class="mb-24rpx rounded-12rpx bg-orange-50 p-16rpx text-28rpx text-orange-600">
        请先在"字典类型"中选择一个字典类型
      </view>

      <view
        v-for="item in list"
        :key="item.id"
        class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm"
        @click="handleDetail(item)"
      >
        <view class="p-24rpx">
          <view class="mb-16rpx flex items-center justify-between">
            <view class="text-32rpx text-[#333] font-semibold">
              {{ item.label }}
            </view>
            <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="item.status" />
          </view>
          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">字典键值：</text>
            <text class="min-w-0 flex-1 truncate">{{ item.value }}</text>
          </view>
          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">字典排序：</text>
            <text>{{ item.sort }}</text>
          </view>
          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">颜色类型：</text>
            <view v-if="item.colorType" class="rounded-4rpx px-8rpx py-2rpx text-24rpx text-white" :style="{ backgroundColor: getColorStyle(item.colorType) }">
              {{ item.colorType }}
            </view>
            <text v-else>-</text>
          </view>
          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">CSS Class：</text>
            <view v-if="item.cssClass" class="rounded-4rpx px-8rpx py-2rpx text-24rpx text-white" :style="{ backgroundColor: item.cssClass }">
              {{ item.cssClass }}
            </view>
            <text v-else>-</text>
          </view>
          <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">创建时间：</text>
            <text>{{ formatDateTime(item.createTime) || '-' }}</text>
          </view>
        </view>
      </view>

      <!-- 加载更多 -->
      <view v-if="loadMoreState !== 'loading' && list.length === 0" class="py-100rpx text-center">
        <wd-status-tip image="content" tip="暂无字典数据" />
      </view>
      <wd-loadmore
        v-if="list.length > 0"
        :state="loadMoreState"
        @reload="loadMore"
      />
    </view>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['system:dict:create']) && dictType"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { DictData } from '@/api/system/dict/data'
import type { LoadMoreState } from '@/http/types'
import { ref, watch } from 'vue'
import { getDictDataPage } from '@/api/system/dict/data'
import { useAccess } from '@/hooks/useAccess'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import DataSearchForm from './data-search-form.vue'

const props = defineProps<{
  dictType?: string
}>()

const { hasAccessByCodes } = useAccess()
const total = ref(0)
const list = ref<DictData[]>([])
const loadMoreState = ref<LoadMoreState>('loading')
const queryParams = ref({
  pageNo: 1,
  pageSize: 10,
  dictType: undefined as string | undefined,
})

/** 颜色类型映射 */
const colorMap: Record<string, string> = {
  processing: '#1890ff',
  success: '#52c41a',
  default: '#d9d9d9',
  warning: '#faad14',
  error: '#ff4d4f',
  pink: '#eb2f96',
  red: '#f5222d',
  orange: '#fa8c16',
  green: '#52c41a',
  cyan: '#13c2c2',
  blue: '#1890ff',
  purple: '#722ed1',
}

/** 获取颜色样式 */
function getColorStyle(colorType: string) {
  return colorMap[colorType] || colorType
}

/** 查询列表 */
async function getList() {
  if (!props.dictType) {
    list.value = []
    loadMoreState.value = 'finished'
    return
  }
  loadMoreState.value = 'loading'
  try {
    const data = await getDictDataPage({
      ...queryParams.value,
      dictType: props.dictType,
    })
    list.value = [...list.value, ...data.list]
    total.value = data.total
    loadMoreState.value = list.value.length >= total.value ? 'finished' : 'loading'
  } catch {
    queryParams.value.pageNo = queryParams.value.pageNo > 1 ? queryParams.value.pageNo - 1 : 1
    loadMoreState.value = 'error'
  }
}

/** 搜索按钮操作 */
function handleQuery(data?: Record<string, any>) {
  queryParams.value = {
    ...data,
    pageNo: 1,
    pageSize: queryParams.value.pageSize,
    dictType: props.dictType,
  }
  list.value = []
  getList()
}

/** 重置按钮操作 */
function handleReset() {
  handleQuery()
}

/** 加载更多 */
function loadMore() {
  if (loadMoreState.value === 'finished') {
    return
  }
  queryParams.value.pageNo++
  getList()
}

/** 新增 */
function handleAdd() {
  uni.navigateTo({
    url: `/pages-system/dict/data/form/index?dictType=${props.dictType}`,
  })
}

/** 查看详情 */
function handleDetail(item: DictData) {
  uni.navigateTo({
    url: `/pages-system/dict/data/detail/index?id=${item.id}`,
  })
}

/** 监听 dictType 变化，重新查询 */
watch(
  () => props.dictType,
  () => {
    if (props.dictType) {
      queryParams.value.pageNo = 1
      list.value = []
      getList()
    }
  },
)

/** 触底加载更多 */
onReachBottom(() => {
  loadMore()
})

/** 初始化 */
onMounted(() => {
  if (props.dictType) {
    getList()
  }
})
</script>
