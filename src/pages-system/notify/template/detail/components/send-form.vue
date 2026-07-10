<template>
  <wd-popup
    v-model="visible"
    position="bottom"
    closable
    safe-area-inset-bottom
    custom-style="height: 80vh; border-radius: 16rpx 16rpx 0 0; overflow: hidden;"
  >
    <view class="h-full flex flex-col bg-white">
      <!-- 表单内容 -->
      <scroll-view scroll-y class="min-h-0 flex-1">
        <view class="p-24rpx">
          <view class="mb-24rpx text-32rpx text-[#333] font-semibold">
            发送测试站内信
          </view>
          <wd-form ref="sendFormRef" :model="sendFormData" :schema="sendFormSchema">
            <wd-cell-group border>
              <wd-form-item title="模板内容" title-width="180rpx">
                <wd-textarea
                  v-model="sendFormData.content"
                  disabled
                  :rows="3"
                />
              </wd-form-item>
              <!-- 用户类型 -->
              <wd-form-item title="用户类型" title-width="180rpx" prop="userType" center>
                <wd-radio-group v-model="sendFormData.userType" type="button">
                  <wd-radio
                    v-for="dict in getIntDictOptions(DICT_TYPE.USER_TYPE)"
                    :key="dict.value"
                    :value="dict.value"
                  >
                    {{ dict.label }}
                  </wd-radio>
                </wd-radio-group>
              </wd-form-item>
              <!-- 会员用户：输入用户编号 -->
              <wd-form-item v-if="sendFormData.userType === UserTypeEnum.MEMBER" title="接收人 ID" title-width="180rpx" prop="userId">
                <wd-input
                  v-model="sendFormData.userId"
                  clearable
                  placeholder="请输入用户编号"
                />
              </wd-form-item>
              <!-- 管理员用户：选择用户 -->
              <UserFormPicker
                v-if="sendFormData.userType !== UserTypeEnum.MEMBER"
                v-model="adminUserId"
                label="接收人"
                label-width="180rpx"
                prop="userId"
                placeholder="请选择接收人"
              />
              <!-- 动态参数 -->
              <template v-for="param in template?.params" :key="param">
                <wd-form-item :title="`参数 ${param}`" title-width="180rpx" :prop="`templateParams.${param}`">
                  <wd-input
                    v-model="sendFormData.templateParams[param]"
                    clearable
                    :placeholder="`请输入参数 ${param}`"
                  />
                </wd-form-item>
              </template>
            </wd-cell-group>
          </wd-form>
        </view>
      </scroll-view>

      <!-- 底部操作 -->
      <view class="border-t border-[#f0f0f0] bg-white p-24rpx">
        <wd-button type="primary" block :loading="sendLoading" @click="handleSendSubmit">
          发送
        </wd-button>
      </view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { NotifyTemplate } from '@/api/system/notify/template'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref, watch } from 'vue'
import { sendNotify } from '@/api/system/notify/template'
import { UserFormPicker } from '@/components/system-select'
import { getIntDictOptions } from '@/hooks/useDict'
import { DICT_TYPE, UserTypeEnum } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{
  modelValue: boolean
  template?: NotifyTemplate
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
}) // 发送弹窗显示状态

const sendLoading = ref(false)
const sendFormData = ref({
  content: '',
  userType: UserTypeEnum.MEMBER,
  userId: undefined as number | string | undefined,
  templateParams: {} as Record<string, string>,
})
const sendFormSchema = createFormSchema(() => {
  return {
    userType: [{ required: true, message: '用户类型不能为空' }],
    userId: [{ required: true, message: '接收人不能为空' }],
    ...Object.fromEntries(
      (props.template?.params || []).map(param => [
        `templateParams.${param}`,
        [{ required: true, message: `参数 ${param} 不能为空` }],
      ]),
    ),
  }
})
const sendFormRef = ref<any>()
const adminUserId = computed<number | undefined>({
  get: () => typeof sendFormData.value.userId === 'number' ? sendFormData.value.userId : undefined,
  set: (value) => {
    sendFormData.value.userId = value
  },
})

/** 初始化 */
function initSendForm() {
  sendFormData.value = {
    content: props.template?.content || '',
    userType: UserTypeEnum.MEMBER,
    userId: undefined,
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

/** 提交表单 */
async function handleSendSubmit() {
  const { valid } = await sendFormRef.value.validate()
  if (!valid) {
    return
  }

  sendLoading.value = true
  try {
    await sendNotify({
      userId: Number(sendFormData.value.userId),
      userType: sendFormData.value.userType,
      templateCode: props.template?.code || '',
      templateParams: sendFormData.value.templateParams,
    })
    toast.success('站内信发送成功')
    emit('success')
    visible.value = false
  } finally {
    sendLoading.value = false
  }
}
</script>
