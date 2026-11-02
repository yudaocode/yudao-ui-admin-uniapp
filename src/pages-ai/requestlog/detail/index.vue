<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="请求日志详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <scroll-view scroll-y class="min-h-0 flex-1">
      <view class="p-24rpx">
        <view class="overflow-hidden rounded-16rpx bg-white shadow-sm">
          <wd-cell-group border>
            <wd-cell title="编号" :value="formData?.id ?? ''" />
            <wd-cell title="请求编号">
              <text selectable class="text-24rpx">{{ formData?.requestId || '' }}</text>
            </wd-cell>
            <wd-cell title="业务类型">
              <dict-tag v-if="formData?.bizType != null" :type="DICT_TYPE.AI_REQUEST_LOG_BIZ_TYPE" :value="formData.bizType" />
            </wd-cell>
            <wd-cell title="业务编号" :value="formData?.bizId ?? ''" />
            <wd-cell title="用户" :value="getUserName(formData)" />
            <wd-cell title="平台">
              <dict-tag v-if="formData?.platform" :type="DICT_TYPE.AI_PLATFORM" :value="formData.platform" />
            </wd-cell>
            <wd-cell title="模型编号" :value="formData?.modelId ?? ''" />
            <wd-cell title="模型标识" :value="formData?.model || ''" />
            <wd-cell title="状态">
              <dict-tag v-if="formData?.status != null" :type="DICT_TYPE.AI_REQUEST_LOG_STATUS" :value="formData.status" />
            </wd-cell>
            <wd-cell title="开始时间" :value="formatDateTime(formData?.beginTime) || ''" />
            <wd-cell title="结束时间" :value="formatDateTime(formData?.endTime) || ''" />
            <wd-cell title="耗时" :value="formData?.duration != null ? `${formData.duration} ms` : ''" />
            <wd-cell title="错误信息" :value="formData?.errorMessage || ''" />
            <wd-cell title="输入 Token" :value="formData ? formatAiTokens(formData.inputTokens) : ''" />
            <wd-cell title="输出 Token" :value="formData ? formatAiTokens(formData.outputTokens) : ''" />
            <wd-cell title="合计 Token" :value="formData ? formatAiTokens(formData.totalTokens) : ''" />
            <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || ''" />
          </wd-cell-group>
        </view>

        <!-- 响应元数据原始 JSON：纯文本展示，水平滚动 -->
        <view class="mt-24rpx overflow-hidden rounded-16rpx bg-white shadow-sm">
          <wd-collapse v-model="activeNames">
            <wd-collapse-item name="metadata" title="响应元数据 (JSON)">
              <scroll-view v-if="metadataText" scroll-x class="rounded-8rpx bg-[#f7f8fa]">
                <text selectable class="block whitespace-pre p-20rpx text-24rpx text-[#333]">{{ metadataText }}</text>
              </scroll-view>
              <view v-else class="py-24rpx text-center text-24rpx text-[#999]">
                暂无元数据
              </view>
            </wd-collapse-item>
          </wd-collapse>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script lang="ts" setup>
import type { AiRequestLog } from '@/api/ai/requestlog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { getRequestLog } from '@/api/ai/requestlog'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE, formatAiTokens } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { formatJson } from '@/utils/format'

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
const formData = ref<AiRequestLog>() // 详情数据
const activeNames = ref<string[]>([]) // 展开的折叠面板
const metadataText = computed(() => formatJson(formData.value?.responseMetadata)) // 响应元数据文本

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-ai/requestlog/index')
}

/** 加载请求日志详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getRequestLog(Number(props.id))
  } finally {
    toast.close()
  }
}

/** 获取用户昵称：后端已拼接，用户不存在时显示编号 */
function getUserName(item?: AiRequestLog) {
  return item?.userNickname || (item?.userId ? String(item.userId) : '')
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>
