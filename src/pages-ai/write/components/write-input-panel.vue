<template>
  <view class="shrink-0 bg-[#f7f8fa] px-20rpx pb-[calc(18rpx+env(safe-area-inset-bottom))] pt-12rpx">
    <view class="border border-[#eee] rounded-28rpx bg-white px-22rpx pb-16rpx pt-18rpx shadow-[0_12rpx_48rpx_rgba(0,0,0,0.08)]">
      <wd-textarea
        v-model="formData.prompt"
        placeholder="输入写作要求"
        :maxlength="1200"
        auto-height
        compact
        custom-style="--wot-textarea-inner-min-height: 54rpx; --wot-textarea-inner-max-height: 180rpx; --wot-textarea-inner-font-size: 28rpx; --wot-textarea-inner-line-height: 42rpx;"
      />
      <view class="mt-14rpx flex items-center justify-between">
        <view class="flex items-center gap-12rpx">
          <view class="flex items-center gap-8rpx rounded-full bg-[#f5f5f5] px-18rpx py-10rpx" @click="settingsVisible = true">
            <wd-icon name="settings" size="26rpx" color="#666" />
            <text class="text-22rpx text-[#555]">{{ formData.type === AiWriteTypeEnum.WRITING ? '撰写' : '回复' }} · 参数</text>
          </view>
          <view v-if="hasResult" class="rounded-full bg-[#f5f5f5] px-18rpx py-10rpx text-22rpx text-[#666]" @click="emit('reset')">
            新建
          </view>
        </view>
        <view
          class="h-64rpx w-64rpx flex items-center justify-center rounded-full"
          :class="formData.prompt.trim() && !writing ? 'bg-[#615ced]' : 'bg-[#d9d9d9]'"
          @click="writing ? emit('stop') : emit('submit')"
        >
          <wd-icon :name="writing ? 'stop' : 'arrow-up'" size="32rpx" color="#fff" />
        </view>
      </view>
    </view>
    <view class="pt-10rpx text-center text-20rpx text-[#aaa]">
      内容由 AI 生成，请注意甄别
    </view>
  </view>

  <!-- 写作参数 -->
  <wd-popup
    v-model="settingsVisible"
    position="bottom"
    root-portal
    safe-area-inset-bottom
    :lazy-render="false"
    custom-style="max-height: 86vh; overflow: auto; border-radius: 32rpx 32rpx 0 0;"
  >
    <view class="px-24rpx pb-28rpx pt-24rpx">
      <view class="mb-22rpx flex items-center justify-between px-4rpx">
        <text class="text-32rpx text-[#222] font-semibold">写作参数</text>
        <wd-icon name="close" size="36rpx" color="#999" @click="settingsVisible = false" />
      </view>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="类型" title-width="160rpx" prop="type" center>
            <wd-radio-group v-model="formData.type" type="button">
              <wd-radio :value="AiWriteTypeEnum.WRITING">
                撰写
              </wd-radio>
              <wd-radio :value="AiWriteTypeEnum.REPLY">
                回复
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
          <wd-form-item v-if="formData.type === AiWriteTypeEnum.REPLY" title="原文" title-width="160rpx" prop="originalContent">
            <wd-textarea
              v-model="formData.originalContent"
              placeholder="请输入需要回复的原文"
              :maxlength="2000"
              show-word-limit
              clearable
            />
          </wd-form-item>
          <yd-form-picker v-model="formData.length" label="长度" label-width="160rpx" :dict-type="DICT_TYPE.AI_WRITE_LENGTH" />
          <yd-form-picker v-model="formData.format" label="格式" label-width="160rpx" :dict-type="DICT_TYPE.AI_WRITE_FORMAT" />
          <yd-form-picker v-model="formData.tone" label="语气" label-width="160rpx" :dict-type="DICT_TYPE.AI_WRITE_TONE" />
          <yd-form-picker v-model="formData.language" label="语言" label-width="160rpx" :dict-type="DICT_TYPE.AI_WRITE_LANGUAGE" />
        </wd-cell-group>
      </wd-form>
      <view class="mt-24rpx">
        <wd-button block type="primary" @click="settingsVisible = false">
          完成
        </wd-button>
      </view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { AiWriteGenerateReq } from '@/api/ai/write'
import { ref } from 'vue'
import { AiWriteTypeEnum, DICT_TYPE } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'

defineProps<{
  hasResult: boolean
  writing: boolean
}>()
const emit = defineEmits<{
  reset: []
  stop: []
  submit: []
}>()
const formData = defineModel<AiWriteGenerateReq>({ required: true })
const formRef = ref<FormInstance>() // 表单组件引用
const settingsVisible = ref(false) // 写作参数弹窗
const formSchema = createFormSchema({
  type: [{ required: true, message: '请选择写作类型' }],
  prompt: [{ required: true, message: '请输入写作要求' }],
  originalContent: [{ required: () => formData.value.type === AiWriteTypeEnum.REPLY, message: '请输入需要回复的原文' }],
})

/** 校验写作参数 */
function validate() {
  return formRef.value?.validate()
}

defineExpose({ validate })
</script>
