<template>
  <view>
    <ExperienceSearchForm @search="handleQuery" @reset="handleReset" />
    <scroll-view scroll-y class="min-h-520rpx">
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-20rpx rounded-12rpx bg-white p-24rpx shadow-sm"
        >
          <view class="mb-16rpx flex items-center justify-between">
            <view class="min-w-0 flex-1 truncate text-30rpx text-[#333] font-semibold">
              {{ item.title || '成长值变动' }}
            </view>
            <wd-tag :type="(item.experience || 0) > 0 ? 'success' : 'danger'" variant="plain">
              {{ (item.experience || 0) > 0 ? `+${item.experience}` : item.experience }}
            </wd-tag>
          </view>
          <view class="mb-12rpx text-26rpx text-[#666]">
            {{ item.description || '-' }}
          </view>
          <view class="mb-12rpx flex items-center text-26rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">总成长值：</text>
            <text>{{ item.totalExperience ?? '-' }}</text>
          </view>
          <view class="mb-12rpx flex items-center text-26rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">业务类型：</text>
            <dict-tag :type="DICT_TYPE.MEMBER_EXPERIENCE_BIZ_TYPE" :value="item.bizType" />
          </view>
          <view class="text-24rpx text-[#999]">
            {{ formatDateTime(item.createTime) || '-' }}
          </view>
        </view>
        <wd-empty v-if="!loading && list.length === 0" icon="content" tip="暂无成长值记录" />
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
import type { MemberExperienceRecord } from '@/api/member/experience-record'
import { computed, onMounted, ref, watch } from 'vue'
import { getMemberExperienceRecordPage } from '@/api/member/experience-record'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import ExperienceSearchForm from './experience-search-form.vue'

const props = defineProps<{
  userId?: number | any
}>()

const list = ref<MemberExperienceRecord[]>([]) // 列表数据
const loading = ref(false) // 加载状态
const total = ref(0) // 总条数
const pageNo = ref(1) // 当前页码
const pageSize = 10 // 每页条数
const queryParams = ref<Record<string, any>>({}) // 查询参数
const hasMore = computed(() => list.value.length < total.value)

/** 查询成长值记录 */
async function getList(reset = true) {
  if (!props.userId) {
    list.value = []
    total.value = 0
    return
  }
  loading.value = true
  try {
    const currentPageNo = reset ? 1 : pageNo.value + 1
    const data = await getMemberExperienceRecordPage({
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
