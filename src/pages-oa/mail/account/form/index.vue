<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="getTitle"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <view class="min-h-0 flex-1 overflow-auto p-24rpx">
      <!-- 表单区域 -->
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-input
            v-model="formData.mail"
            label="邮箱地址"
            label-width="220rpx"
            prop="mail"
            placeholder="请输入邮箱地址"
            :disabled="isUpdate"
            clearable
            @blur="handleMailBlur"
          />
          <yd-form-picker
            v-model="formData.providerId"
            label="邮箱服务"
            label-width="220rpx"
            prop="providerId"
            :columns="providerColumns"
            placeholder="请选择邮箱服务"
            :disabled="isUpdate"
          />
          <wd-input
            v-model="formData.username"
            label="登录名"
            label-width="220rpx"
            prop="username"
            placeholder="请输入登录名"
            :disabled="isUpdate"
            clearable
          />
          <wd-input
            v-model="formData.password"
            label="授权码/密码"
            label-width="220rpx"
            prop="password"
            :placeholder="isUpdate ? '留空表示不修改' : '请输入授权码或密码'"
            show-password
            clearable
          />
          <wd-cell title="设为默认" title-width="220rpx">
            <wd-switch v-model="formData.defaultStatus" />
          </wd-cell>
          <wd-cell title="状态" title-width="220rpx">
            <wd-radio-group v-model="formData.status" inline>
              <wd-radio
                v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
                :key="dict.value"
                :value="dict.value"
              >
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-cell>
        </wd-cell-group>
      </wd-form>
    </view>

    <!-- 底部保存按钮 -->
    <view class="yd-detail-footer">
      <wd-button
        type="primary"
        block
        :loading="formLoading"
        @click="handleSubmit"
      >
        保存
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { MailAccount } from '@/api/oa/mail'
import { computed, onMounted, ref } from 'vue'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import {
  createMailAccount,
  getMailAccount,
  getSimpleMailProviderList,
  updateMailAccount,
} from '@/api/oa/mail'
import { getIntDictOptions } from '@/hooks/useDict'
import { navigateBackPlus } from '@/utils'
import { CommonStatusEnum, DICT_TYPE } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{
  id?: string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const isUpdate = computed(() => !!props.id) // 是否修改
const getTitle = computed(() => props.id ? '编辑邮箱账号' : '绑定邮箱账号')
const formLoading = ref(false) // 表单提交状态
const providerColumns = ref<{ label: string, value: number }[]>([]) // 邮箱服务选项
const formData = ref<MailAccount>({
  providerId: undefined,
  mail: '',
  username: '',
  password: '',
  defaultStatus: false,
  status: CommonStatusEnum.ENABLE,
}) // 表单数据
const formSchema = createFormSchema({ // 表单校验规则
  mail: [{ required: true, message: '邮箱地址不能为空' }, { type: 'email', message: '请输入正确邮箱地址' }],
  providerId: [{ required: true, message: '邮箱服务不能为空' }],
  username: [{ required: true, message: '登录名不能为空' }],
  password: [{ required: () => !props.id, message: '授权码或密码不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-oa/mail/account/index')
}

/** 邮箱输入后补充默认登录名 */
function handleMailBlur() {
  if (!formData.value.username) {
    formData.value.username = formData.value.mail
  }
}

/** 加载账号详情，密码不回显 */
async function getDetail() {
  if (!props.id) {
    return
  }
  const data = await getMailAccount(Number(props.id))
  formData.value = { ...data, password: '' }
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  formLoading.value = true
  try {
    if (props.id) {
      await updateMailAccount(formData.value)
    } else {
      await createMailAccount(formData.value)
    }
    toast.success('保存成功')
    navigateBackPlus('/pages-oa/mail/account/index')
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  const providers = await getSimpleMailProviderList()
  providerColumns.value = providers.map(item => ({ label: item.name, value: item.id! }))
  getDetail()
})
</script>
