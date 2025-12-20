<template>
  <!-- TODO @芋艿：【优化】底部操作的样式 -->
  <wd-popup v-model="visible" position="bottom" closable custom-style="border-radius: 16rpx 16rpx 0 0;">
    <view class="p-24rpx">
      <view class="mb-24rpx text-32rpx text-[#333] font-semibold">
        发送测试短信
      </view>
      <wd-form ref="sendFormRef" :model="sendFormData" :rules="sendFormRules">
        <wd-cell-group border>
          <wd-textarea
            v-model="sendFormData.content"
            label="模板内容"
            label-width="180rpx"
            disabled
            :rows="3"
          />
          <wd-input
            v-model="sendFormData.mobile"
            label="手机号码"
            label-width="180rpx"
            prop="mobile"
            clearable
            placeholder="请输入手机号码"
          />
          <template v-for="param in template?.params" :key="param">
            <wd-input
              v-model="sendFormData.templateParams[param]"
              :label="`参数 ${param}`"
              label-width="180rpx"
              :prop="`templateParams.${param}`"
              clearable
              :placeholder="`请输入参数 ${param}`"
            />
          </template>
        </wd-cell-group>
      </wd-form>
      <view class="mt-24rpx">
        <wd-button type="primary" block :loading="sendLoading" @click="handleSendSubmit">
          发送
        </wd-button>
      </view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { SmsTemplate } from '@/api/system/sms'
import { computed, ref, watch } from 'vue'
import { useToast } from 'wot-design-uni'
import { sendSms } from '@/api/system/sms'

const props = defineProps<{
  modelValue: boolean
  template?: SmsTemplate
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'success': []
}>()

const toast = useToast()

const visible = computed({
  get() {
    return props.modelValue
  },
  set(value: boolean) {
    emit('update:modelValue', value)
  },
})

const sendLoading = ref(false)
const sendFormRef = ref<any>()
const sendFormData = ref({
  content: '',
  mobile: '',
  templateParams: {} as Record<string, string>,
})

const sendFormRules = computed(() => {
  const rules: Record<string, any> = {
    mobile: [{ required: true, message: '手机号码不能为空' }],
  }
  if (props.template?.params) {
    props.template.params.forEach((param) => {
      rules[`templateParams.${param}`] = [{ required: true, message: `参数 ${param} 不能为空` }]
    })
  }
  return rules
})

function initSendForm() {
  sendFormData.value = {
    content: props.template?.content || '',
    mobile: '',
    templateParams: {},
  }
  if (props.template?.params) {
    props.template.params.forEach((param) => {
      sendFormData.value.templateParams[param] = ''
    })
  }
}

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      initSendForm()
    }
  },
)

async function handleSendSubmit() {
  const { valid } = await sendFormRef.value.validate()
  if (!valid) {
    return
  }

  sendLoading.value = true
  try {
    await sendSms({
      mobile: sendFormData.value.mobile,
      templateCode: props.template?.code || '',
      templateParams: sendFormData.value.templateParams,
    })
    toast.success('短信发送成功')
    emit('success')
    visible.value = false
  } finally {
    sendLoading.value = false
  }
}
</script>
