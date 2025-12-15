<template>
  <view class="page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="访问日志详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view class="p-24rpx">
      <wd-cell-group custom-class="cell-group" border>
        <wd-cell title="日志编号" :value="String(formData?.id ?? '-')" />
        <wd-cell title="链路追踪" :value="formData?.traceId || '-'" />
        <wd-cell title="应用名" :value="formData?.applicationName || '-'" />
        <wd-cell title="用户编号" :value="String(formData?.userId ?? '-')" />
        <wd-cell title="用户类型" :value="getDictLabel(DICT_TYPE.USER_TYPE, formData?.userType) || '-'" />
        <wd-cell title="用户 IP" :value="formData?.userIp || '-'" />
        <wd-cell title="用户 UA" :value="formData?.userAgent || '-'" />
        <wd-cell title="请求信息" :value="getRequestInfo()" />
        <wd-cell title="请求参数" is-link @click="handleCopyText(formData?.requestParams, '请求参数')">
          <view class="max-w-400rpx truncate text-right">
            {{ formData?.requestParams || '-' }}
          </view>
        </wd-cell>
        <wd-cell title="请求结果" is-link @click="handleCopyText(formData?.responseBody, '请求结果')">
          <view class="max-w-400rpx truncate text-right">
            {{ formData?.responseBody || '-' }}
          </view>
        </wd-cell>
        <wd-cell title="请求时间" :value="getRequestTimeRange()" />
        <wd-cell title="请求耗时" :value="formData?.duration ? `${formData.duration} ms` : '-'" />
        <wd-cell title="操作结果">
          <template v-if="formData?.resultCode === 0">
            <wd-tag type="success" plain>
              正常
            </wd-tag>
          </template>
          <template v-else-if="formData?.resultCode">
            <text>失败 | {{ formData.resultCode }} | {{ formData.resultMsg }}</text>
          </template>
          <template v-else>
            <text>-</text>
          </template>
        </wd-cell>
        <wd-cell title="操作模块" :value="formData?.operateModule || '-'" />
        <wd-cell title="操作名" :value="formData?.operateName || '-'" />
        <wd-cell title="操作类型" :value="getDictLabel(DICT_TYPE.INFRA_OPERATE_TYPE, formData?.operateType) || '-'" />
      </wd-cell-group>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { ApiAccessLog } from '@/api/infra/apiAccessLog'
import { onMounted, ref } from 'vue'
import { getApiAccessLog } from '@/api/infra/apiAccessLog'
import { getDictLabel } from '@/hooks/useDict'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{
  id: number
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const formData = ref<ApiAccessLog>() // 详情数据

/** 返回上一页 */
function handleBack() {
  uni.navigateBack()
}

/** 复制文本并提示 */
function handleCopyText(text?: string, title?: string) {
  if (!text || text === '-') {
    return
  }
  uni.setClipboardData({
    data: text,
    success: () => {
      uni.showToast({
        title: `${title || '内容'}已复制`,
        icon: 'success',
      })
    },
  })
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getApiAccessLog(props.id)
}

/** 获取请求信息 */
function getRequestInfo() {
  if (formData.value?.requestMethod && formData.value?.requestUrl) {
    return `${formData.value.requestMethod} ${formData.value.requestUrl}`
  }
  return '-'
}

/** 获取请求时间范围 */
function getRequestTimeRange() {
  if (formData.value?.beginTime && formData.value?.endTime) {
    return `${formatDateTime(formData.value.beginTime)} ~ ${formatDateTime(formData.value.endTime)}`
  }
  return '-'
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>

<style lang="scss" scoped>
:deep(.cell-group) {
  border-radius: 12rpx;
  overflow: hidden;
  box-shadow: 0 3rpx 8rpx rgba(24, 144, 255, 0.06);
}
</style>
