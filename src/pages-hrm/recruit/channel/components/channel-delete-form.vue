<template>
  <wd-popup v-model="visible" position="bottom" closable safe-area-inset-bottom @close="handleClose">
    <view class="p-32rpx">
      <view class="mb-24rpx text-center text-32rpx text-[#333] font-semibold">
        删除招聘渠道
      </view>
      <view class="mb-24rpx rounded-12rpx bg-[#fff7e6] px-24rpx py-20rpx text-26rpx text-[#d48806]">
        删除后，相关员工和候选人的招聘渠道将同步变更
      </view>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-cell title="删除渠道" :value="channelName || '-'" />
          <ChannelFormPicker
            v-model="formData.transferChannelId"
            label="承接渠道"
            prop="transferChannelId"
            :exclude-ids="formData.id ? [formData.id] : []"
            placeholder="请选择承接渠道"
          />
        </wd-cell-group>
      </wd-form>
      <view class="mt-32rpx flex gap-24rpx">
        <wd-button class="flex-1" variant="plain" @click="handleClose">
          取消
        </wd-button>
        <wd-button class="flex-1" type="danger" :loading="formLoading" @click="handleSubmit">
          确定删除
        </wd-button>
      </view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { RecruitChannel } from '@/api/hrm/recruit/channel'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { ref, watch } from 'vue'
import { deleteRecruitChannel } from '@/api/hrm/recruit/channel'
import { createFormSchema } from '@/utils/wot'
import ChannelFormPicker from './channel-form-picker.vue'

const props = defineProps<{
  modelValue: boolean
  channel?: RecruitChannel
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'success': []
}>()

const toast = useToast()
const visible = ref(false) // 弹窗显示状态
const formLoading = ref(false) // 表单提交状态
const channelName = ref('') // 待删除渠道名称
const formData = ref({
  id: undefined as number | undefined,
  transferChannelId: undefined as number | undefined,
}) // 删除表单
const formSchema = createFormSchema({
  transferChannelId: [{ required: true, message: '承接渠道不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

watch(() => props.modelValue, (value) => {
  visible.value = value
  if (value && props.channel?.id) {
    formData.value = {
      id: props.channel.id,
      transferChannelId: undefined,
    }
    channelName.value = props.channel.name
  }
})

watch(visible, (value) => {
  emit('update:modelValue', value)
})

/** 关闭弹窗 */
function handleClose() {
  visible.value = false
  formData.value = {
    id: undefined,
    transferChannelId: undefined,
  }
  channelName.value = ''
}

/** 提交删除 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid || !formData.value.id || !formData.value.transferChannelId) {
    return
  }

  formLoading.value = true
  try {
    await deleteRecruitChannel({
      id: formData.value.id,
      transferChannelId: formData.value.transferChannelId,
    })
    toast.success('删除成功')
    handleClose()
    emit('success')
  } finally {
    formLoading.value = false
  }
}
</script>
