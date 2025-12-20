<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="短信日志详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border>
        <wd-cell title="日志编号" :value="String(formData?.id ?? '-')" />
        <wd-cell title="手机号" :value="String(formData?.mobile ?? '-')" />
        <wd-cell title="短信渠道">
          <dict-tag :type="DICT_TYPE.SYSTEM_SMS_CHANNEL_CODE" :value="formData?.channelCode" />
        </wd-cell>
        <wd-cell title="模板编号" :value="String(formData?.templateId ?? '-')" />
        <wd-cell title="模板类型">
          <dict-tag :type="DICT_TYPE.SYSTEM_SMS_TEMPLATE_TYPE" :value="formData?.templateType" />
        </wd-cell>
        <wd-cell title="短信内容" :value="String(formData?.templateContent ?? '-')" />
        <wd-cell title="发送状态">
          <dict-tag :type="DICT_TYPE.SYSTEM_SMS_SEND_STATUS" :value="formData?.sendStatus" />
        </wd-cell>
        <wd-cell title="发送时间" :value="formatDateTime(formData?.sendTime) || '-'" />
        <wd-cell title="API 发送编码" :value="String(formData?.apiSendCode ?? '-')" />
        <wd-cell title="API 发送消息" :value="String(formData?.apiSendMsg ?? '-')" />
        <wd-cell title="接收状态">
          <dict-tag :type="DICT_TYPE.SYSTEM_SMS_RECEIVE_STATUS" :value="formData?.receiveStatus" />
        </wd-cell>
        <wd-cell title="接收时间" :value="formatDateTime(formData?.receiveTime) || '-'" />
        <wd-cell title="API 接收编码" :value="String(formData?.apiReceiveCode ?? '-')" />
        <wd-cell title="API 接收消息" :value="String(formData?.apiReceiveMsg ?? '-')" />
        <wd-cell title="API 请求 ID" :value="String(formData?.apiRequestId ?? '-')" />
        <wd-cell title="API 序列号" :value="String(formData?.apiSerialNo ?? '-')" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { SmsLog } from '@/api/system/sms/log'
import { onMounted, ref } from 'vue'
import { useToast } from 'wot-design-uni'
import { getSmsLogPage } from '@/api/system/sms/log'
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

const toast = useToast()
const formData = ref<SmsLog>()

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-system/sms/index')
}

/** 加载详情 - 由于没有单独的获取详情接口，通过列表接口获取 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    // 通过分页接口获取单条数据
    const data = await getSmsLogPage({ pageNo: 1, pageSize: 1, id: props.id })
    if (data.list && data.list.length > 0) {
      formData.value = data.list[0]
    }
  } finally {
    toast.close()
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>

<style lang="scss" scoped>
</style>
