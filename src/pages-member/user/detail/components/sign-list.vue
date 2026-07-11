<template>
  <view class="min-h-0 flex flex-1 flex-col">
    <!-- 搜索组件 -->
    <SearchForm hide-user @search="handleQuery" @reset="handleReset" />

    <!-- 签到记录列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无签到记录"
      @query="queryList"
    >
      <view class="p-24rpx pb-160rpx">
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
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { MemberSignInRecord } from '@/api/member/signin/record'
import { ref, watch } from 'vue'
import { getMemberSignInRecordPage } from '@/api/member/signin/record'
import { formatDateTime } from '@/utils/date'
import SearchForm from '../../../signin/record/components/search-form.vue'

const props = defineProps<{
  userId?: number | any
}>()

const list = ref<MemberSignInRecord[]>([]) // 列表数据
const pagingRef = ref<ZPagingRef<MemberSignInRecord>>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数

/** 查询签到记录 */
async function queryList(pageNo: number, pageSize: number) {
  if (!props.userId) {
    pagingRef.value?.complete([])
    return
  }
  try {
    const data = await getMemberSignInRecordPage({
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
