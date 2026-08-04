<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="打卡记录详情"
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
        <wd-cell title="打卡类型">
          <dict-tag
            v-if="formData.type != null"
            :type="DICT_TYPE.HRM_ATTENDANCE_CLOCK_TYPE"
            :value="formData.type"
          />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="应打卡时间" :value="formatDateTime(formData.attendanceTime) || '-'" />
        <wd-cell title="打卡时间" :value="formatDateTime(formData.clockTime) || '-'" />
        <wd-cell title="状态">
          <dict-tag
            v-if="formData.status != null"
            :type="DICT_TYPE.HRM_ATTENDANCE_CLOCK_STATUS"
            :value="formData.status"
          />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="打卡来源">
          <dict-tag
            v-if="formData.sourceType != null"
            :type="DICT_TYPE.HRM_ATTENDANCE_CLOCK_SOURCE"
            :value="formData.sourceType"
          />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="打卡地点" :value="formData.address || '-'" />
        <wd-cell title="WiFi 名称" :value="formData.ssid || '-'" />
        <wd-cell title="备注" :value="formData.remark || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData.createTime) || '-'" />
      </wd-cell-group>
    </view>

    <!-- 底部操作按钮：仅手工录入可编辑/删除 -->
    <view v-if="hasFooter" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button
          v-if="canUpdate"
          class="flex-1"
          type="warning"
          @click="handleEdit"
        >
          编辑
        </wd-button>
        <wd-button
          v-if="canDelete"
          class="flex-1"
          type="danger"
          :loading="deleting"
          @click="handleDelete"
        >
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { AttendanceClock } from '@/api/hrm/attendance/clock'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { deleteAttendanceClock, getAttendanceClock } from '@/api/hrm/attendance/clock'
import { useAccess } from '@/hooks/useAccess'
import { HrmAttendanceClockSource, HrmAttendanceClockType } from '@/pages-hrm/utils/constants'
import { delay, navigateBackPlus } from '@/utils'
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
const dialog = useDialog()
const formData = ref<AttendanceClock>({ // 详情数据
  type: HrmAttendanceClockType.ON_DUTY,
})
const deleting = ref(false) // 删除中
const isManualClock = computed(() => formData.value.sourceType === HrmAttendanceClockSource.MANUAL) // 仅手工录入可改删
const canUpdate = computed(() => isManualClock.value && hasAccessByCodes(['hrm:attendance:clock:update']))
const canDelete = computed(() => isManualClock.value && hasAccessByCodes(['hrm:attendance:clock:delete']))
const hasFooter = computed(() => canUpdate.value || canDelete.value)

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-hrm/attendance/clock/index')
}

/** 加载打卡记录详情 */
async function getDetail() {
  if (!props.id || deleting.value) {
    return
  }
  formData.value = await getAttendanceClock(Number(props.id))
}

/** 编辑打卡记录 */
function handleEdit() {
  uni.navigateTo({
    url: `/pages-hrm/attendance/clock/form/index?id=${props.id}`,
  })
}

/** 删除打卡记录 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定删除该打卡记录吗？删除后会立即影响日/月考勤统计。',
    })
  } catch {
    return
  }

  deleting.value = true
  try {
    await deleteAttendanceClock(Number(props.id))
    toast.success('删除成功')
    uni.$emit('hrm:attendance:clock:reload')
    delay(handleBack)
  } catch {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  uni.$on('hrm:attendance:clock:reload', getDetail)
  getDetail()
})

/** 卸载 */
onUnload(() => {
  uni.$off('hrm:attendance:clock:reload', getDetail)
})
</script>
