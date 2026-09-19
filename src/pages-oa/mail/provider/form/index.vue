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
        <wd-cell-group border title="基本信息">
          <wd-input
            v-model="formData.name"
            label="名称"
            label-width="220rpx"
            prop="name"
            placeholder="例如：腾讯企业邮箱"
            clearable
          />
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

        <wd-cell-group border title="收信连接（IMAP）">
          <wd-input
            v-model="formData.imap.host"
            label="服务器域名"
            label-width="220rpx"
            prop="imap.host"
            placeholder="例如：imap.exmail.qq.com"
            clearable
          />
          <wd-cell title="服务器端口" title-width="220rpx">
            <wd-input-number v-model="formData.imap.port" :min="1" :max="65535" :precision="0" />
          </wd-cell>
          <wd-cell title="开启 SSL" title-width="220rpx">
            <wd-switch v-model="formData.imap.sslEnable" @change="handleSslChange('imap')" />
          </wd-cell>
          <wd-cell title="开启 STARTTLS" title-width="220rpx">
            <wd-switch v-model="formData.imap.starttlsEnable" @change="handleStarttlsChange('imap')" />
          </wd-cell>
        </wd-cell-group>

        <wd-cell-group border title="发信连接（SMTP）">
          <wd-input
            v-model="formData.smtp.host"
            label="服务器域名"
            label-width="220rpx"
            prop="smtp.host"
            placeholder="例如：smtp.exmail.qq.com"
            clearable
          />
          <wd-cell title="服务器端口" title-width="220rpx">
            <wd-input-number v-model="formData.smtp.port" :min="1" :max="65535" :precision="0" />
          </wd-cell>
          <wd-cell title="开启 SSL" title-width="220rpx">
            <wd-switch v-model="formData.smtp.sslEnable" @change="handleSslChange('smtp')" />
          </wd-cell>
          <wd-cell title="开启 STARTTLS" title-width="220rpx">
            <wd-switch v-model="formData.smtp.starttlsEnable" @change="handleStarttlsChange('smtp')" />
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
import type { MailProvider } from '@/api/oa/mail'
import { computed, onMounted, ref } from 'vue'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import {
  createMailProvider,
  getMailProvider,
  updateMailProvider,
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
const getTitle = computed(() => props.id ? '编辑服务配置' : '新增服务配置')
const formLoading = ref(false) // 表单提交状态
const formData = ref<Partial<MailProvider>>({
  name: '',
  imap: { host: '', port: 993, sslEnable: true, starttlsEnable: false },
  smtp: { host: '', port: 465, sslEnable: true, starttlsEnable: false },
  status: CommonStatusEnum.ENABLE,
}) // 表单数据
const formSchema = createFormSchema({
  'name': [{ required: true, message: '名称不能为空' }],
  'imap.host': [{ required: true, message: '收信服务器域名不能为空' }],
  'smtp.host': [{ required: true, message: '发信服务器域名不能为空' }],
}) // 表单校验规则
const formRef = ref<FormInstance>() // 表单组件引用

/** SSL 与 STARTTLS 互斥：后端要求两者只能开启一个 */
function handleSslChange(protocol: 'imap' | 'smtp') {
  formData.value[protocol]!.starttlsEnable = !formData.value[protocol]!.sslEnable
}

/** STARTTLS 与 SSL 互斥 */
function handleStarttlsChange(protocol: 'imap' | 'smtp') {
  formData.value[protocol]!.sslEnable = !formData.value[protocol]!.starttlsEnable
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-oa/mail/provider/index')
}

/** 加载服务配置详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getMailProvider(Number(props.id))
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
      await updateMailProvider(formData.value)
    } else {
      await createMailProvider(formData.value)
    }
    toast.success('保存成功')
    navigateBackPlus('/pages-oa/mail/provider/index')
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>
