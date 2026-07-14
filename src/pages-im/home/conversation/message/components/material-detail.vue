<template>
  <wd-popup v-model="visible" position="bottom" root-portal custom-style="height: 80vh; border-radius: 24rpx 24rpx 0 0;">
    <view class="h-full flex flex-col bg-white">
      <view class="flex items-center justify-between border-b border-b-[#f2f3f5] px-24rpx py-20rpx">
        <view class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
          {{ detail?.title || payload?.title || '频道素材' }}
        </view>
        <wd-button size="small" variant="plain" @click="visible = false">
          关闭
        </wd-button>
      </view>
      <scroll-view class="min-h-0 flex-1" scroll-y>
        <view class="p-24rpx">
          <wd-loading v-if="loading" />
          <template v-else>
            <wd-img
              v-if="(detail?.coverUrl || payload?.coverUrl)"
              :src="detail?.coverUrl || payload?.coverUrl"
              custom-class="mb-24rpx bg-[#f2f3f5]"
              width="100%"
              height="320rpx"
              radius="12rpx"
              mode="aspectFill"
            />
            <view class="mb-16rpx text-36rpx text-[#333] font-semibold leading-48rpx">
              {{ detail?.title || payload?.title || '频道素材' }}
            </view>
            <view
              v-if="detail?.summary || payload?.summary"
              class="mb-24rpx text-26rpx text-[#666] leading-40rpx"
            >
              {{ detail?.summary || payload?.summary }}
            </view>
            <rich-text v-if="detail?.content" :nodes="detail.content" />
            <view
              v-else-if="detail?.url || payload?.url"
              class="break-all text-26rpx text-[#1677ff]"
              @click="openUrl(detail?.url || payload?.url || '')"
            >
              {{ detail?.url || payload?.url }}
            </view>
            <wd-empty v-else icon="content" tip="暂无正文" />
          </template>
        </view>
      </scroll-view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue'
import type { ImChannelMaterialRespVO } from '@/api/im/channel/material'
import type { MaterialMessage } from '@/pages-im/utils/message'
import { computed, ref, watch } from 'vue'
import { getChannelMaterial } from '@/api/im/channel/material'
import { openUrl } from '@/utils/url'

const props = defineProps({
  modelValue: { type: Boolean, default: false }, // 是否显示
  payload: { type: Object as PropType<MaterialMessage>, default: undefined }, // 素材消息内容（消息里携带的概要）
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const visible = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const loading = ref(false) // 详情加载状态
const detail = ref<ImChannelMaterialRespVO>() // 素材完整详情
let requestSeq = 0 // 素材详情请求序号

/** 打开素材时拉取完整详情 */
watch([visible, () => props.payload?.materialId], async ([isVisible, materialId]) => {
  // TODO @AI：seq 这种会不会过度了？只要判断 id 想同，是不是足够了？另外，还有没类似的，也清理下，不要过度封装噢；
  const seq = ++requestSeq
  detail.value = undefined
  if (!isVisible || !materialId) {
    loading.value = false
    return
  }
  loading.value = true
  try {
    const data = await getChannelMaterial(materialId)
    if (seq === requestSeq && visible.value) {
      detail.value = data
    }
  } finally {
    if (seq === requestSeq) {
      loading.value = false
    }
  }
})
</script>
