<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="短信模板详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border>
        <wd-cell title="模板编号" :value="String(formData?.id ?? '-')" />
        <wd-cell title="模板名称" :value="String(formData?.name ?? '-')" />
        <wd-cell title="模板编码" :value="String(formData?.code ?? '-')" />
        <wd-cell title="短信类型">
          <dict-tag :type="DICT_TYPE.SYSTEM_SMS_TEMPLATE_TYPE" :value="formData?.type" />
        </wd-cell>
        <wd-cell title="开启状态">
          <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="formData?.status" />
        </wd-cell>
        <wd-cell title="模板内容" :value="String(formData?.content ?? '-')" />
        <wd-cell title="API 模板编号" :value="String(formData?.apiTemplateId ?? '-')" />
        <wd-cell title="短信渠道">
          <dict-tag :type="DICT_TYPE.SYSTEM_SMS_CHANNEL_CODE" :value="formData?.channelCode" />
        </wd-cell>
        <wd-cell title="备注" :value="String(formData?.remark ?? '-')" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>
    </view>

    <!-- 底部操作按钮 -->
    <view class="fixed bottom-0 left-0 right-0 bg-white p-24rpx">
      <view class="w-full flex gap-24rpx">
        <wd-button
          v-if="hasAccessByCodes(['system:sms-template:send-sms'])"
          class="flex-1" type="primary" @click="handleSendTest"
        >
          测试
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['system:sms-template:update'])"
          class="flex-1" type="warning" @click="handleEdit"
        >
          编辑
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['system:sms-template:delete'])"
          class="flex-1" type="error" :loading="deleting" @click="handleDelete"
        >
          删除
        </wd-button>
      </view>
    </view>

    <!-- 发送测试短信弹窗 -->
    <wd-popup v-model="sendVisible" position="bottom" closable custom-style="border-radius: 16rpx 16rpx 0 0;">
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
            <template v-for="param in formData?.params" :key="param">
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
  </view>
</template>

<script lang="ts" setup>
import type { SmsTemplate } from '@/api/system/sms'
import { onMounted, ref, watch } from 'vue'
import { useToast } from 'wot-design-uni'
import { deleteSmsTemplate, getSmsTemplate, sendSms } from '@/api/system/sms'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{
  id?: number | any
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const formData = ref<SmsTemplate>()
const deleting = ref(false)

// 发送测试短信相关
const sendVisible = ref(false)
const sendLoading = ref(false)
const sendFormRef = ref()
const sendFormData = ref({
  content: '',
  mobile: '',
  templateParams: {} as Record<string, string>,
})
const sendFormRules = {
  mobile: [{ required: true, message: '手机号码不能为空' }],
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-system/sms/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getSmsTemplate(props.id)
  } finally {
    toast.close()
  }
}

/** 编辑 */
function handleEdit() {
  uni.navigateTo({
    url: `/pages-system/sms/template/form/index?id=${props.id}`,
  })
}

/** 删除 */
function handleDelete() {
  if (!props.id) {
    return
  }
  uni.showModal({
    title: '提示',
    content: '确定要删除该短信模板吗？',
    success: async (res) => {
      if (!res.confirm) {
        return
      }
      deleting.value = true
      try {
        await deleteSmsTemplate(props.id)
        toast.success('删除成功')
        setTimeout(() => {
          handleBack()
        }, 500)
      } finally {
        deleting.value = false
      }
    },
  })
}

/** 打开发送测试短信弹窗 */
function handleSendTest() {
  sendFormData.value = {
    content: formData.value?.content || '',
    mobile: '',
    templateParams: {},
  }
  // 初始化模板参数
  if (formData.value?.params) {
    formData.value.params.forEach((param) => {
      sendFormData.value.templateParams[param] = ''
    })
  }
  sendVisible.value = true
}

/** 发送测试短信 */
async function handleSendSubmit() {
  const { valid } = await sendFormRef.value.validate()
  if (!valid) {
    return
  }

  sendLoading.value = true
  try {
    await sendSms({
      mobile: sendFormData.value.mobile,
      templateCode: formData.value?.code || '',
      templateParams: sendFormData.value.templateParams,
    })
    toast.success('短信发送成功')
    sendVisible.value = false
  } finally {
    sendLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>

<style lang="scss" scoped>
</style>
