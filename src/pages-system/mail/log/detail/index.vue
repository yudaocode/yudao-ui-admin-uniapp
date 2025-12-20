<template>
  <view class="yd-page-container">
    <wd-navbar
      title="邮件日志详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <view>
      <wd-cell-group border>
        <wd-cell title="日志编号" :value="String(formData?.id ?? '-')" />
        <wd-cell title="发送邮箱" :value="String(formData?.fromMail ?? '-')" />
        <wd-cell title="接收信息" :value="formatReceiveInfo(formData)" />
        <wd-cell title="模板编号" :value="String(formData?.templateId ?? '-')" />
        <wd-cell title="模板编码" :value="String(formData?.templateCode ?? '-')" />
        <wd-cell title="邮件标题" :value="String(formData?.templateTitle ?? '-')" />
        <wd-cell title="邮件内容" :value="String(formData?.templateContent ?? '-')" />
        <wd-cell title="发送状态">
          <dict-tag :type="DICT_TYPE.SYSTEM_MAIL_SEND_STATUS" :value="formData?.sendStatus" />
        </wd-cell>
        <wd-cell title="发送时间" :value="formatDateTime(formData?.sendTime) || '-'" />
        <wd-cell title="发送消息编号" :value="String(formData?.sendMessageId ?? '-')" />
        <wd-cell title="发送异常" :value="String(formData?.sendException ?? '-')" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { MailLog } from '@/api/system/mail/log/index'
import { onMounted, ref } from 'vue'
import { useToast } from 'wot-design-uni'
import { getMailLogPage } from '@/api/system/mail/log/index'
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
const formData = ref<MailLog>()

function handleBack() {
  navigateBackPlus('/pages-system/mail/index')
}

function formatReceiveInfo(data?: MailLog) {
  if (!data) {
    return '-'
  }
  const lines: string[] = []
  if (data.toMails && data.toMails.length > 0) {
    lines.push(`收件：${data.toMails.join('、')}`)
  }
  if (data.ccMails && data.ccMails.length > 0) {
    lines.push(`抄送：${data.ccMails.join('、')}`)
  }
  if (data.bccMails && data.bccMails.length > 0) {
    lines.push(`密送：${data.bccMails.join('、')}`)
  }
  return lines.length > 0 ? lines.join('；') : '-'
}

async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    const data = await getMailLogPage({ pageNo: 1, pageSize: 1, id: props.id })
    if (data.list && data.list.length > 0) {
      formData.value = data.list[0]
    }
  } finally {
    toast.close()
  }
}

onMounted(() => {
  getDetail()
})
</script>

<style lang="scss" scoped>
</style>
