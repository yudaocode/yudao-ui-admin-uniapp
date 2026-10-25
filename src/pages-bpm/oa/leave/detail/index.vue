<template>
  <view :class="embedded ? '' : 'yd-page-container'">
    <!-- 顶部导航栏（仅路由访问时显示） -->
    <wd-navbar
      v-if="!embedded"
      title="请假详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group :border="!embedded">
        <wd-cell title="申请编号" :value="formData.id ? String(formData.id) : '-'" />
        <wd-cell title="请假类型">
          <dict-tag :type="DICT_TYPE.BPM_OA_LEAVE_TYPE" :value="formData.type" />
        </wd-cell>
        <wd-cell title="开始时间" :value="formatDateTime(formData.startTime) || '-'" />
        <wd-cell title="结束时间" :value="formatDateTime(formData.endTime) || '-'" />
        <wd-cell title="请假原因" :value="formData.reason || '-'" />
        <wd-cell title="审批状态">
          <dict-tag :type="DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS" :value="formData.status" />
        </wd-cell>
        <wd-cell title="创建时间" :value="formatDateTime(formData.createTime) || '-'" />
      </wd-cell-group>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { Leave } from '@/api/bpm/oa/leave'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import { getLeave } from '@/api/bpm/oa/leave'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{
  id?: number | string
  embedded?: boolean // 是否作为嵌入组件使用（非路由访问）
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const formData = ref<Partial<Leave>>({}) // 详情数据

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-bpm/oa/leave/index')
}

/** 加载请假详情 */
async function getDetail() {
  if (!props.id) {
    toast.show('参数错误')
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getLeave(props.id as number)
  } finally {
    toast.close()
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>
