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
        <wd-cell title="模板编号" :value="formData?.id" />
        <wd-cell title="模板名称" :value="formData?.name" />
        <wd-cell title="模板编码" :value="formData?.code" />
        <wd-cell title="短信类型">
          <dict-tag :type="DICT_TYPE.SYSTEM_SMS_TEMPLATE_TYPE" :value="formData?.type" />
        </wd-cell>
        <wd-cell title="开启状态">
          <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="formData?.status" />
        </wd-cell>
        <wd-cell title="模板内容" :value="formData?.content" />
        <wd-cell title="API 模板编号" :value="formData?.apiTemplateId" />
        <wd-cell title="短信渠道">
          <dict-tag :type="DICT_TYPE.SYSTEM_SMS_CHANNEL_CODE" :value="formData?.channelCode" />
        </wd-cell>
        <wd-cell title="备注" :value="formData?.remark ?? '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>
    </view>

    <!-- 发送测试短信弹窗 -->
    <SendForm v-model="sendVisible" :template="formData" />

    <!-- 底部操作按钮 -->
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
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
  </view>
</template>

<script lang="ts" setup>
import type { SmsTemplate } from '@/api/system/sms/template'
import { onMounted, ref } from 'vue'
import { useToast } from 'wot-design-uni'
import { deleteSmsTemplate, getSmsTemplate } from '@/api/system/sms/template'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import SendForm from './components/send-form.vue'

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
  sendVisible.value = true
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>

<style lang="scss" scoped>
</style>
