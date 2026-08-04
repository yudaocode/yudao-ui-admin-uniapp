<template>
  <view class="min-h-0 flex flex-1 flex-col">
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="20"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无操作日志"
      @query="queryList"
    >
      <view class="p-24rpx pb-32rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
        >
          <view class="mb-12rpx flex items-center justify-between gap-16rpx">
            <text class="min-w-0 flex-1 text-28rpx text-[#333] font-semibold">
              {{ item.action || '-' }}
            </text>
            <text class="shrink-0 text-26rpx text-[#999]">
              {{ formatDateTime(item.createTime) || '-' }}
            </text>
          </view>
          <view class="flex items-center text-26rpx text-[#666]">
            <text>操作人：{{ item.userName || '-' }}</text>
            <dict-tag
              v-if="item.userType != null"
              :type="DICT_TYPE.USER_TYPE"
              :value="item.userType"
              class="ml-8rpx"
            />
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { HrmOperateLog } from '@/api/hrm/operate-log'
import { ref, watch } from 'vue'
import { getHrmOperateLogPage } from '@/api/hrm/operate-log'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{
  bizId: number
  bizType: number
}>()

const list = ref<HrmOperateLog[]>([]) // 操作日志
const pagingRef = ref<any>() // 分页组件引用

/** 查询操作日志 */
async function queryList(pageNo: number, pageSize: number) {
  if (!props.bizId || !props.bizType) {
    pagingRef.value?.complete([])
    return
  }
  try {
    const data = await getHrmOperateLogPage({
      pageNo,
      pageSize,
      bizId: props.bizId,
      bizType: props.bizType,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

watch(() => [props.bizType, props.bizId], () => pagingRef.value?.reload())
</script>
