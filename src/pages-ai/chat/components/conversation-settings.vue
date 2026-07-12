<template>
  <wd-popup v-model="visible" position="bottom" custom-style="max-height: 86vh; overflow: auto; border-radius: 32rpx 32rpx 0 0;">
    <view v-if="visible" class="bg-white">
      <view class="border-b border-[#eee] p-28rpx text-32rpx font-semibold">
        对话设定
      </view>
      <view class="p-24rpx">
        <wd-form :model="form">
          <wd-cell-group border>
            <wd-form-item title="角色设定" title-width="220rpx">
              <wd-textarea
                v-model="form.systemMessage"
                placeholder="请输入角色设定"
                :maxlength="2000"
                show-word-limit
                clearable
              />
            </wd-form-item>
            <ModelFormPicker
              v-model="form.modelId"
              label-width="220rpx"
              :model-type="AiModelTypeEnum.CHAT"
            />
            <wd-form-item title="温度参数" title-width="220rpx">
              <wd-input-number v-model="form.temperature" :min="0" :max="2" :step="0.1" />
            </wd-form-item>
            <wd-form-item title="回复 Token" title-width="220rpx">
              <wd-input-number v-model="form.maxTokens" :min="0" :max="8192" />
            </wd-form-item>
            <wd-form-item title="上下文数量" title-width="220rpx">
              <wd-input-number v-model="form.maxContexts" :min="0" :max="20" />
            </wd-form-item>
          </wd-cell-group>
        </wd-form>
      </view>
      <view class="yd-detail-footer">
        <view class="yd-detail-footer-actions">
          <wd-button class="flex-1" variant="plain" @click="visible = false">
            取消
          </wd-button>
          <wd-button class="flex-1" type="primary" :loading="loading" @click="emit('save')">
            保存
          </wd-button>
        </view>
      </view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { ChatConversation } from '@/api/ai/chat/conversation'
import ModelFormPicker from '@/pages-ai/model/model/components/model-form-picker.vue'
import { AiModelTypeEnum } from '@/utils/constants'

defineProps<{
  loading: boolean
}>()
const emit = defineEmits<{
  save: []
}>()
const visible = defineModel<boolean>({ default: false })
const form = defineModel<ChatConversation>('form', { required: true })
</script>
