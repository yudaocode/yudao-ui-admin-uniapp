<template>
  <z-paging
    ref="pagingRef"
    v-model="list"
    :fixed="false"
    class="min-h-0 flex-1"
    :default-page-size="10"
    :refresher-enabled="true"
    :inside-more="true"
    :loading-more-default-as-loading="true"
    empty-view-text="暂无识别记录"
    @query="queryList"
  >
    <view class="p-24rpx">
      <view
        v-for="item in list"
        :key="item.id"
        class="mb-24rpx border-2rpx rounded-12rpx border-solid bg-white p-24rpx shadow-sm"
        :class="item.id === currentId ? 'border-[#1677ff]' : 'border-transparent'"
      >
        <view class="flex gap-20rpx" @click="emit('open', item)">
          <!-- 原图 -->
          <view class="h-120rpx w-120rpx shrink-0 overflow-hidden rounded-8rpx bg-[#f5f5f5]">
            <wd-img :src="item.imageUrl" width="120rpx" height="120rpx" mode="aspectFill" />
          </view>
          <!-- 基本信息 -->
          <view class="min-w-0 flex-1">
            <view class="flex items-center justify-between gap-12rpx">
              <text class="truncate text-28rpx text-[#333] font-semibold">{{ item.fileName }}</text>
              <wd-tag :type="item.status === AiOcrStatusEnum.SUCCESS ? 'success' : 'danger'" class="shrink-0">
                {{ item.status === AiOcrStatusEnum.SUCCESS ? '识别成功' : '识别失败' }}
              </wd-tag>
            </view>
            <view class="mt-8rpx truncate text-22rpx text-[#999]">
              {{ formatDate(item.createTime, 'YYYY-MM-DD HH:mm') }} · {{ item.modelName }}
            </view>
            <view
              v-if="item.status === AiOcrStatusEnum.FAIL"
              class="line-clamp-2 mt-8rpx break-all text-24rpx text-[#f5222d]"
            >
              {{ item.errorMessage }}
            </view>
            <view v-else class="line-clamp-2 mt-8rpx whitespace-pre-wrap break-all text-24rpx text-[#666]">
              {{ item.originalText || '（无文字）' }}
            </view>
          </view>
        </view>

        <!-- 操作 -->
        <view class="mt-16rpx flex items-center justify-end gap-16rpx">
          <wd-button size="small" type="primary" variant="plain" @click="emit('open', item)">
            打开
          </wd-button>
          <wd-button size="small" type="danger" variant="plain" @click="emit('delete', item)">
            删除
          </wd-button>
        </view>
      </view>
    </view>
  </z-paging>
</template>

<script lang="ts" setup>
import type { Ocr } from '@/api/ai/ocr'
import { ref } from 'vue'
import { getOcrMyPage } from '@/api/ai/ocr'
import { AiOcrStatusEnum } from '@/utils/constants'
import { formatDate } from '@/utils/date'

defineProps<{
  currentId?: number // 识别页当前打开的记录编号
}>()

const emit = defineEmits<{
  open: [item: Ocr] // 打开记录：恢复到识别页
  delete: [item: Ocr] // 删除记录
}>()

const list = ref<Ocr[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用

/** 查询识别记录 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getOcrMyPage({ pageNo, pageSize })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 刷新列表 */
function reload() {
  pagingRef.value?.reload()
}

defineExpose({ reload })
</script>
