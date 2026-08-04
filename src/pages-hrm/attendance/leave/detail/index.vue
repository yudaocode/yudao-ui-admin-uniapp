<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="请假记录详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border>
        <wd-cell title="员工" :value="formData.employeeName || '-'" />
        <wd-cell title="工号" :value="formData.jobNumber || '-'" />
        <wd-cell title="部门" :value="formData.deptName || '-'" />
        <wd-cell title="岗位" :value="formData.postName || '-'" />
        <wd-cell title="请假类型">
          <dict-tag
            v-if="formData.type"
            :type="DICT_TYPE.HRM_ATTENDANCE_LEAVE_TYPE"
            :value="formData.type"
          />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="开始时间" :value="formatDateTime(formData.startTime) || '-'" />
        <wd-cell title="结束时间" :value="formatDateTime(formData.endTime) || '-'" />
        <wd-cell title="请假天数" :value="formData.day != null ? `${formData.day} 天` : '-'" />
        <wd-cell title="请假事由" :value="formData.reason || '-'" />
        <wd-cell title="备注" :value="formData.remark || '-'" />
        <wd-cell title="审批状态">
          <dict-tag
            v-if="formData.approvalStatus != null"
            :type="DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS"
            :value="formData.approvalStatus"
          />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="审批时间" :value="formatDateTime(formData.approvalTime) || '-'" />
        <wd-cell title="审批意见" :value="formData.approvalReason || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData.createTime) || '-'" />
      </wd-cell-group>
    </view>

    <!-- 底部操作：跳转 BPM 审批进度 -->
    <view v-if="formData.processInstanceId" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button class="flex-1" type="primary" @click="handleViewProcess">
          审批进度
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { AttendanceLeave } from '@/api/hrm/attendance/leave'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import { getAttendanceLeave } from '@/api/hrm/attendance/leave'
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
const formData = ref<AttendanceLeave>({ // 详情数据
  type: '',
  day: 0,
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-hrm/attendance/leave/index')
}

/** 加载请假记录详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getAttendanceLeave(Number(props.id))
}

/** 查看审批进度 */
function handleViewProcess() {
  const processInstanceId = formData.value.processInstanceId
  if (!processInstanceId) {
    toast.show('暂无审批流程')
    return
  }
  uni.navigateTo({
    url: `/pages-bpm/processInstance/detail/index?id=${processInstanceId}`,
  })
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>
