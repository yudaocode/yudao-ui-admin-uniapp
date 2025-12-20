<template>
  <!-- TODO @芋艿：【优化】底部操作的样式 -->
  <wd-popup v-model="visible" position="bottom" closable custom-style="border-radius: 16rpx 16rpx 0 0;">
    <view class="p-24rpx">
      <view class="mb-24rpx text-32rpx text-[#333] font-semibold">
        发送测试站内信
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
          <!-- 用户类型 -->
          <wd-cell title="用户类型" title-width="180rpx" prop="userType" center>
            <wd-radio-group v-model="sendFormData.userType" shape="button">
              <wd-radio
                v-for="dict in getIntDictOptions(DICT_TYPE.USER_TYPE)"
                :key="dict.value"
                :value="dict.value"
              >
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-cell>
          <!-- 会员用户：输入用户编号 -->
          <wd-input
            v-if="sendFormData.userType === UserTypeEnum.MEMBER"
            v-model="sendFormData.userId"
            label="接收人 ID"
            label-width="180rpx"
            prop="userId"
            clearable
            placeholder="请输入用户编号"
          />
          <!-- 管理员用户：选择用户 -->
          <wd-cell
            v-if="sendFormData.userType === UserTypeEnum.ADMIN"
            title="接收人"
            title-width="180rpx"
            prop="userId"
            center
          >
            <wd-picker
              v-model="sendFormData.userId"
              :columns="userOptions"
              placeholder="请选择接收人"
            />
          </wd-cell>
          <!-- 动态参数 -->
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
import type { NotifyTemplate } from '@/api/system/notify/template'
import type { User } from '@/api/system/user'
import { computed, ref, watch } from 'vue'
import { useToast } from 'wot-design-uni'
import { sendNotify } from '@/api/system/notify/template'
import { getSimpleUserList } from '@/api/system/user'
import { getIntDictOptions } from '@/hooks/useDict'
import { DICT_TYPE, UserTypeEnum } from '@/utils/constants'

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
})

const sendLoading = ref(false)
const sendFormRef = ref<any>()
const sendFormData = ref({
  content: '',
  userType: UserTypeEnum.MEMBER,
  userId: undefined as number | string | undefined,
  templateParams: {} as Record<string, string>,
})

/** 用户列表 */
const userList = ref<User[]>([])
const userOptions = computed(() => {
  return userList.value.map(item => ({
    value: item.id,
    label: item.nickname,
  }))
})

/** 发送表单校验规则 */
const sendFormRules = computed(() => {
  const rules: Record<string, any> = {
    userType: [{ required: true, message: '用户类型不能为空' }],
    userId: [{ required: true, message: '接收人不能为空' }],
  }
  if (props.template?.params) {
    props.template.params.forEach((param) => {
      rules[`templateParams.${param}`] = [{ required: true, message: `参数 ${param} 不能为空` }]
    })
  }
  return rules
})

/** 加载用户列表 */
async function loadUserList() {
  userList.value = await getSimpleUserList()
}

/** 初始化发送表单 */
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
      loadUserList()
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
