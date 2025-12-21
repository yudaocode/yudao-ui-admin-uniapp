<template>
  <wd-popup
    v-model="visible"
    position="bottom"
    custom-style="border-radius: 24rpx 24rpx 0 0; height: 50%"
    safe-area-inset-bottom
    @close="visible = false"
  >
    <view class="h-full flex flex-col p-32rpx">
      <!-- 标题 -->
      <view class="mb-32rpx flex items-center justify-between">
        <view class="text-36rpx text-[#333] font-semibold">
          消息详情
        </view>
        <view class="p-8rpx" @click="visible = false">
          <wd-icon name="close" size="20px" color="#999" />
        </view>
      </view>

      <!-- 详情内容 -->
      <view v-if="formData" class="flex flex-1 flex-col overflow-hidden space-y-24rpx">
        <view class="flex items-start">
          <text class="w-160rpx shrink-0 text-28rpx text-[#999]">发送人</text>
          <text class="text-28rpx text-[#333]">{{ formData.templateNickname }}</text>
        </view>
        <view class="flex items-start">
          <text class="w-160rpx shrink-0 text-28rpx text-[#999]">发送时间</text>
          <text class="text-28rpx text-[#333]">{{ formatDateTime(formData.createTime) }}</text>
        </view>
        <view class="flex items-start">
          <text class="w-160rpx shrink-0 text-28rpx text-[#999]">消息类型</text>
          <text class="text-28rpx text-[#333]">
            {{ getDictLabel(DICT_TYPE.SYSTEM_NOTIFY_TEMPLATE_TYPE, formData.templateType) }}
          </text>
        </view>
        <view class="flex items-start">
          <text class="w-160rpx shrink-0 text-28rpx text-[#999]">是否已读</text>
          <wd-tag v-if="formData.readStatus" type="success" plain>
            已读
          </wd-tag>
          <wd-tag v-else type="warning" plain>
            未读
          </wd-tag>
        </view>
        <view v-if="formData.readStatus" class="flex items-start">
          <text class="w-160rpx shrink-0 text-28rpx text-[#999]">阅读时间</text>
          <text class="text-28rpx text-[#333]">{{ formatDateTime(formData.readTime) || '-' }}</text>
        </view>
        <view class="flex flex-1 flex-col overflow-hidden">
          <text class="mb-12rpx w-160rpx shrink-0 text-28rpx text-[#999]">消息内容</text>
          <view class="flex-1 rounded-12rpx bg-[#f5f5f5] p-24rpx">
            <text class="text-28rpx text-[#333]">{{ formData.templateContent }}</text>
          </view>
        </view>
      </view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { NotifyMessage } from '@/api/system/notify/message'
import { ref } from 'vue'
import { getDictLabel } from '@/hooks/useDict'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

const visible = ref(false)
const formData = ref<NotifyMessage>()

/** 打开弹窗 */
function open(data: NotifyMessage) {
  formData.value = data
  visible.value = true
}

/** 关闭弹窗 */
function close() {
  visible.value = false
}

defineExpose({ open, close })
</script>
