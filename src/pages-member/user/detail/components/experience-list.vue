<template>
  <view class="min-h-0 flex flex-1 flex-col">
    <!-- 搜索组件 -->
    <ExperienceSearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 成长值记录列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无成长值记录"
      @query="queryList"
    >
      <view class="p-24rpx pb-160rpx">
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
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { MemberExperienceRecord } from '@/api/member/experience-record'
import { ref, watch } from 'vue'
import { getMemberExperienceRecordPage } from '@/api/member/experience-record'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import ExperienceSearchForm from './experience-search-form.vue'

const props = defineProps<{
  userId?: number | any
}>()

const list = ref<MemberExperienceRecord[]>([]) // 列表数据
const pagingRef = ref<ZPagingRef<MemberExperienceRecord>>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数

/** 查询成长值记录 */
async function queryList(pageNo: number, pageSize: number) {
  if (!props.userId) {
    pagingRef.value?.complete([])
    return
  }
  try {
    const data = await getMemberExperienceRecordPage({
      ...queryParams.value,
      userId: Number(props.userId),
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
  () => props.userId,
  () => reload(),
)
</script>
