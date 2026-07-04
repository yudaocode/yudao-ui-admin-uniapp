<template>
  <view>
    <SearchForm hide-user @search="handleQuery" @reset="handleReset" />
    <scroll-view scroll-y class="min-h-520rpx">
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-20rpx rounded-12rpx bg-white p-24rpx shadow-sm"
        >
          <view class="mb-16rpx flex items-center justify-between">
            <view class="text-30rpx text-[#333] font-semibold">
              第 {{ item.day || 0 }} 天
            </view>
            <wd-tag :type="(item.point || 0) > 0 ? 'success' : 'danger'" variant="plain">
              {{ (item.point || 0) > 0 ? `+${item.point}` : item.point }}
            </wd-tag>
          </view>
          <view class="text-24rpx text-[#999]">
            {{ formatDateTime(item.createTime) || '-' }}
          </view>
        </view>
        <wd-empty v-if="!loading && list.length === 0" icon="content" tip="暂无签到记录" />
        <view v-if="hasMore" class="pb-24rpx">
          <wd-button variant="plain" block :loading="loading" @click="loadMore">
            加载更多
          </wd-button>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script lang="ts" setup>
import type { MemberSignInRecord } from '@/api/member/signin/record'
import { computed, onMounted, ref, watch } from 'vue'
import { getMemberSignInRecordPage } from '@/api/member/signin/record'
import { formatDateTime } from '@/utils/date'
import SearchForm from '../../../signin/record/components/search-form.vue'

const props = defineProps<{
  userId?: number | any
}>()

const list = ref<MemberSignInRecord[]>([]) // 列表数据
const loading = ref(false) // 加载状态
const total = ref(0) // 总条数
const pageNo = ref(1) // 当前页码
const pageSize = 10 // 每页条数
const queryParams = ref<Record<string, any>>({}) // 查询参数
const hasMore = computed(() => list.value.length < total.value)

/** 查询签到记录 */
async function getList(reset = true) {
  if (!props.userId) {
    list.value = []
    total.value = 0
    return
  }
  loading.value = true
  try {
    const currentPageNo = reset ? 1 : pageNo.value + 1
    const data = await getMemberSignInRecordPage({
      ...queryParams.value,
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
