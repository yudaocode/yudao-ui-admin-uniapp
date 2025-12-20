<template>
  <wd-popup v-model="visible" position="bottom" closable custom-style="border-radius: 16rpx 16rpx 0 0;">
    <view class="p-24rpx">
      <view class="mb-24rpx text-32rpx text-[#333] font-semibold">
        发送测试邮件
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
            v-model="sendFormData.toMails"
            label="收件邮箱"
            label-width="180rpx"
            prop="toMails"
            clearable
            placeholder="多个邮箱用逗号分隔"
          />
          <wd-input
            v-model="sendFormData.ccMails"
            label="抄送邮箱"
            label-width="180rpx"
            clearable
            placeholder="多个邮箱用逗号分隔"
          />
          <wd-input
            v-model="sendFormData.bccMails"
            label="密送邮箱"
            label-width="180rpx"
            clearable
            placeholder="多个邮箱用逗号分隔"
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
import type { MailTemplate } from '@/api/system/mail/template'
import { computed, ref, watch } from 'vue'
import { useToast } from 'wot-design-uni'
import { sendMail } from '@/api/system/mail/template'

const props = defineProps<{
  modelValue: boolean
  template?: MailTemplate
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
  toMails: '',
  ccMails: '',
  bccMails: '',
  templateParams: {} as Record<string, string>,
})

/** 发送表单校验规则 */
const sendFormRules = computed(() => {
  const rules: Record<string, any> = {
    toMails: [{ required: true, message: '收件邮箱不能为空' }],
  }
  if (props.template?.params) {
    props.template.params.forEach((param) => {
      rules[`templateParams.${param}`] = [{ required: true, message: `参数 ${param} 不能为空` }]
    })
  }
  return rules
})

/** 格式化邮箱列表 */
// TODO @AI：需要 isEmail 校验下，validator 里有
function normalizeMailList(text: string) {
  return text
    .split(/[,，;；\s]+/)
    .map(s => s.trim())
    .filter(Boolean)
}

/** 初始化发送表单 */
function initSendForm() {
  sendFormData.value = {
    content: props.template?.content || '',
    toMails: '',
    ccMails: '',
    bccMails: '',
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

/** 提交发送 */
async function handleSendSubmit() {
  const { valid } = await sendFormRef.value.validate()
  if (!valid) {
    return
  }

  sendLoading.value = true
  try {
    await sendMail({
      templateCode: props.template?.code || '',
      templateParams: sendFormData.value.templateParams,
      toMails: normalizeMailList(sendFormData.value.toMails),
      ccMails: normalizeMailList(sendFormData.value.ccMails),
      bccMails: normalizeMailList(sendFormData.value.bccMails),
    })
    toast.success('邮件发送成功')
    emit('success')
    visible.value = false
  } finally {
    sendLoading.value = false
  }
}
</script>
