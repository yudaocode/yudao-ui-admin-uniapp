<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="错误日志详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border>
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
        <wd-cell title="异常时间" :value="formatDateTime(formData?.exceptionTime) || '-'" />
        <wd-cell title="异常名" :value="formData?.exceptionName || '-'" />
        <wd-cell title="处理状态">
          <dict-tag :type="DICT_TYPE.INFRA_API_ERROR_LOG_PROCESS_STATUS" :value="formData?.processStatus" />
        </wd-cell>
        <wd-cell v-if="formData?.processUserId" title="处理人" :value="String(formData.processUserId)" />
        <wd-cell v-if="formData?.processTime" title="处理时间" :value="formatDateTime(formData.processTime) || '-'" />
      </wd-cell-group>

      <!-- 异常堆栈 -->
      <view v-if="formData?.exceptionStackTrace" class="mt-24rpx">
        <view class="mb-16rpx text-28rpx text-[#333] font-semibold">
          异常堆栈
        </view>
        <view class="rounded-12rpx bg-white p-24rpx shadow-sm">
          <scroll-view scroll-y class="max-h-600rpx">
            <text class="whitespace-pre-wrap break-all text-24rpx text-[#666] leading-relaxed">{{ formData.exceptionStackTrace }}</text>
          </scroll-view>
        </view>
      </view>
    </view>

    <!-- 底部操作按钮 -->
    <view v-if="formData?.processStatus === InfraApiErrorLogProcessStatusEnum.INIT" class="safe-area-inset-bottom fixed bottom-0 left-0 right-0 bg-white p-24rpx">
      <view class="w-full flex gap-24rpx">
        <wd-button class="flex-1" type="success" :loading="processing" @click="handleProcess(InfraApiErrorLogProcessStatusEnum.DONE)">
          已处理
        </wd-button>
        <wd-button class="flex-1" type="warning" :loading="processing" @click="handleProcess(InfraApiErrorLogProcessStatusEnum.IGNORE)">
          已忽略
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { ApiErrorLog } from '@/api/infra/api-error-log'
import { onMounted, ref } from 'vue'
import { useToast } from 'wot-design-uni'
import { getApiErrorLog, updateApiErrorLogStatus } from '@/api/infra/api-error-log'
import { getDictLabel } from '@/hooks/useDict'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE, InfraApiErrorLogProcessStatusEnum } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{
  id: number | any
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const formData = ref<ApiErrorLog>() // 详情数据
const processing = ref(false) // 处理中

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-infra/api-error-log/index')
}

/** 复制文本并提示 */
function handleCopyText(text?: string, title?: string) {
  if (!text || text === '-') {
    return
  }
  uni.setClipboardData({
    data: text,
    success: () => {
      toast.success(`${title || '内容'}已复制`)
    },
  })
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  toast.loading('加载中...')
  try {
    formData.value = await getApiErrorLog(props.id)
  } finally {
    toast.close()
  }
}

/** 获取请求信息 */
function getRequestInfo() {
  if (formData.value?.requestMethod && formData.value?.requestUrl) {
    return `${formData.value.requestMethod} ${formData.value.requestUrl}`
  }
  return '-'
}

/** 处理日志 */
function handleProcess(processStatus: number) {
  if (!props.id) {
    return
  }
  const statusText = processStatus === InfraApiErrorLogProcessStatusEnum.DONE ? '已处理' : '已忽略'
  uni.showModal({
    title: '提示',
    content: `确定标记为${statusText}吗？`,
    success: async (res) => {
      if (!res.confirm) {
        return
      }
      processing.value = true
      try {
        await updateApiErrorLogStatus(props.id, processStatus)
        toast.success('操作成功')
        // 刷新详情
        await getDetail()
      } finally {
        processing.value = false
      }
    },
  })
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>

<style lang="scss" scoped>
.safe-area-inset-bottom {
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
}
</style>
