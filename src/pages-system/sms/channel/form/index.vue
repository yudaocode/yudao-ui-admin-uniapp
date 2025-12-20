<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="getTitle"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 表单区域 -->
    <view>
      <wd-form ref="formRef" :model="formData" :rules="formRules">
        <wd-cell-group border>
          <wd-input
            v-model="formData.signature"
            label="短信签名"
            label-width="200rpx"
            prop="signature"
            clearable
            placeholder="请输入短信签名"
          />
          <wd-cell title="渠道编码" title-width="200rpx" prop="code" center>
            <wd-picker
              v-model="formData.code"
              :columns="channelCodeOptions"
              placeholder="请选择渠道编码"
            />
          </wd-cell>
          <wd-cell title="启用状态" title-width="200rpx" prop="status" center>
            <wd-radio-group v-model="formData.status" shape="button">
              <wd-radio
                v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
                :key="dict.value"
                :value="dict.value"
              >
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-cell>
          <wd-input
            v-model="formData.apiKey"
            label="API 账号"
            label-width="200rpx"
            prop="apiKey"
            clearable
            placeholder="请输入短信 API 账号"
          />
          <wd-input
            v-model="formData.apiSecret"
            label="API 密钥"
            label-width="200rpx"
            prop="apiSecret"
            clearable
            placeholder="请输入短信 API 密钥"
          />
          <wd-input
            v-model="formData.callbackUrl"
            label="回调 URL"
            label-width="200rpx"
            prop="callbackUrl"
            clearable
            placeholder="请输入短信发送回调 URL"
          />
          <wd-textarea
            v-model="formData.remark"
            label="备注"
            label-width="200rpx"
            prop="remark"
            clearable
            placeholder="请输入备注"
          />
        </wd-cell-group>
      </wd-form>
    </view>

    <!-- 底部保存按钮 -->
    <view class="fixed bottom-0 left-0 right-0 bg-white p-24rpx">
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
import type { SmsChannel } from '@/api/system/sms/channel'
import { computed, onMounted, ref } from 'vue'
import { useToast } from 'wot-design-uni'
import { createSmsChannel, getSmsChannel, updateSmsChannel } from '@/api/system/sms/channel'
import { getIntDictOptions, getStrDictOptions } from '@/hooks/useDict'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'

const props = defineProps<{
  id?: number | any
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const getTitle = computed(() => props.id ? '编辑短信渠道' : '新增短信渠道')
const formLoading = ref(false)
const formData = ref<SmsChannel>({
  id: undefined,
  signature: '',
  code: '',
  status: 0,
  apiKey: '',
  apiSecret: '',
  callbackUrl: '',
  remark: '',
})
const formRules = {
  signature: [{ required: true, message: '短信签名不能为空' }],
  code: [{ required: true, message: '渠道编码不能为空' }],
  status: [{ required: true, message: '启用状态不能为空' }],
  apiKey: [{ required: true, message: 'API 账号不能为空' }],
}
const formRef = ref()

/** 渠道编码选项 */
// TODO @AI：直接使用 getStrDictOptions(DICT_TYPE.SYSTEM_SMS_CHANNEL_CODE) 在 html 里；别的模块，也是这么干的
const channelCodeOptions = computed(() => {
  return getStrDictOptions(DICT_TYPE.SYSTEM_SMS_CHANNEL_CODE).map(item => ({
    value: item.value,
    label: item.label,
  }))
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-system/sms/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getSmsChannel(props.id)
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
      await updateSmsChannel(formData.value)
      toast.success('修改成功')
    } else {
      await createSmsChannel(formData.value)
      toast.success('新增成功')
    }
    setTimeout(() => {
      handleBack()
    }, 500)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>

<style lang="scss" scoped>
</style>
