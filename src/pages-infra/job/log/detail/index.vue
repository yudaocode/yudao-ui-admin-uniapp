<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="调度日志详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border>
        <wd-cell title="日志编号" :value="String(formData?.id ?? '-')" />
        <wd-cell title="任务编号" :value="String(formData?.jobId ?? '-')" />
        <wd-cell title="处理器名称" :value="String(formData?.handlerName ?? '-')" />
        <wd-cell title="处理器参数" :value="String(formData?.handlerParam ?? '-')" />
        <wd-cell title="CRON 表达式" :value="String(formData?.cronExpression ?? '-')" />
        <wd-cell title="执行索引" :value="String(formData?.executeIndex ?? '-')" />
        <wd-cell title="执行状态">
          <dict-tag :type="DICT_TYPE.INFRA_JOB_LOG_STATUS" :value="formData?.status" />
        </wd-cell>
        <wd-cell title="开始时间" :value="formatDateTime(formData?.beginTime) || '-'" />
        <wd-cell title="结束时间" :value="formatDateTime(formData?.endTime) || '-'" />
        <wd-cell title="执行时长" :value="formData?.duration ? `${formData.duration} ms` : '-'" />
        <wd-cell title="执行结果" :value="String(formData?.result ?? '-')" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { JobLog } from '@/api/infra/job/log'
import { onMounted, ref } from 'vue'
import { useToast } from 'wot-design-uni'
import { getJobLog } from '@/api/infra/job/log'
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
const formData = ref<JobLog>()

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-system/job/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getJobLog(Number(props.id))
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
