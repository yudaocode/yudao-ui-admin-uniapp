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
    :empty-view-text="publicStatus ? '暂无广场作品' : '暂无绘图记录'"
    @query="queryList"
  >
    <view class="p-24rpx pb-8rpx">
      <view
        v-for="item in list"
        :key="item.id"
        class="mb-24rpx overflow-hidden rounded-24rpx bg-white shadow-[0_12rpx_44rpx_rgba(0,0,0,0.06)]"
      >
        <image
          v-if="item.picUrl"
          class="h-640rpx w-full bg-[#f1f5f9]"
          :src="item.picUrl"
          mode="aspectFit"
          @click="handlePreview(item.picUrl)"
        />
        <view
          v-else
          class="flex flex-col items-center justify-center gap-18rpx bg-[#f8fafc] px-32rpx text-26rpx text-[#999]"
          :class="item.errorMessage ? 'min-h-200rpx py-32rpx' : 'h-540rpx'"
        >
          <wd-loading v-if="!item.errorMessage" />
          <text class="line-clamp-3 text-center leading-40rpx">{{ item.errorMessage || '正在创作，请稍候' }}</text>
        </view>
        <view class="p-24rpx">
          <view class="mb-16rpx flex items-center justify-between">
            <dict-tag :type="DICT_TYPE.AI_IMAGE_STATUS" :value="item.status" />
            <text class="text-22rpx text-[#999]">{{ formatDateTime(item.createTime) }}</text>
          </view>
          <view class="line-clamp-2 text-28rpx text-[#333]">
            {{ item.prompt || '-' }}
          </view>
          <view class="mt-16rpx text-24rpx text-[#999]">
            {{ item.platform || '-' }} / {{ item.model || '-' }}
          </view>
          <view v-if="item.buttons?.length && !publicStatus" class="mt-18rpx flex flex-wrap gap-12rpx">
            <wd-button
              v-for="button in item.buttons"
              :key="button.customId"
              size="small"
              variant="plain"
              :loading="actionLoadingId === `${item.id}-${button.customId}`"
              @click="emit('action', item, button.customId)"
            >
              {{ button.emoji || '' }}{{ button.label || '操作' }}
            </wd-button>
          </view>
          <view class="mt-20rpx flex items-center justify-between">
            <view class="flex items-center gap-28rpx text-24rpx text-[#666]">
              <view class="flex items-center gap-8rpx" @click="emit('reuse', item)">
                <wd-icon name="refresh" size="30rpx" color="#666" />
                <text>复用参数</text>
              </view>
              <view v-if="!publicStatus" class="flex items-center gap-8rpx text-[#f5222d]" @click="emit('delete', item)">
                <wd-icon name="delete" size="30rpx" color="#f5222d" />
                <text>删除</text>
              </view>
            </view>
            <text class="text-22rpx text-[#999]">点击图片预览</text>
          </view>
        </view>
      </view>
    </view>
  </z-paging>
</template>

<script lang="ts" setup>
import type { AiImage } from '@/api/ai/image'
import { ref } from 'vue'
import { getImagePageMy } from '@/api/ai/image'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{
  publicStatus: boolean
  actionLoadingId: string
}>()
const emit = defineEmits<{
  reuse: [item: AiImage]
  action: [item: AiImage, customId: string]
  delete: [item: AiImage]
}>()

const list = ref<AiImage[]>([]) // 绘图记录
const pagingRef = ref<any>() // 分页组件引用

/** 查询绘图记录 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const params = props.publicStatus ? { pageNo, pageSize, publicStatus: true } : { pageNo, pageSize }
    const data = await getImagePageMy(params)
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 预览图片 */
function handlePreview(url?: string) {
  if (!url) {
    return
  }
  uni.previewImage({ urls: [url] })
}

/** 刷新列表 */
function reload() {
  pagingRef.value?.reload()
}

defineExpose({ reload })
</script>
