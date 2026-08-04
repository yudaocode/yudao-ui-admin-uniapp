<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="节假日详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view class="pb-160rpx">
      <wd-cell-group border>
        <wd-cell title="编号" :value="formData.id != null ? String(formData.id) : '-'" />
        <wd-cell title="日期" :value="formatDate(formData.date) || '-'" />
        <wd-cell title="日期类型">
          <dict-tag
            v-if="formData.type != null"
            :type="DICT_TYPE.HRM_ATTENDANCE_HOLIDAY_TYPE"
            :value="formData.type"
          />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="创建时间" :value="formatDateTime(formData.createTime) || '-'" />
      </wd-cell-group>
    </view>

    <!-- 底部操作按钮 -->
    <view v-if="hasFooter" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button
          v-if="hasAccessByCodes(['hrm:attendance:holiday:update'])"
          class="flex-1"
          type="warning"
          @click="handleEdit"
        >
          编辑
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['hrm:attendance:holiday:delete'])"
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
import type { AttendanceHoliday } from '@/api/hrm/attendance/holiday'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { deleteAttendanceHoliday, getAttendanceHoliday } from '@/api/hrm/attendance/holiday'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate, formatDateTime } from '@/utils/date'
import { HrmAttendanceHolidayType } from '@/pages-hrm/utils/constants'

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
const formData = ref<AttendanceHoliday>({ // 详情数据
  type: HrmAttendanceHolidayType.REST,
})
const deleting = ref(false) // 删除中
const hasFooter = computed(() => { // 底部操作区
  return hasAccessByCodes([
    'hrm:attendance:holiday:update',
    'hrm:attendance:holiday:delete',
  ])
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-hrm/attendance/config/holiday/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id || deleting.value) {
    return
  }
  formData.value = await getAttendanceHoliday(Number(props.id))
}

/** 编辑 */
function handleEdit() {
  uni.navigateTo({
    url: `/pages-hrm/attendance/config/holiday/form/index?id=${props.id}`,
  })
}

/** 删除 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确认删除节假日「${formatDate(formData.value.date) || ''}」吗？`,
    })
  } catch {
    return
  }

  deleting.value = true
  try {
    await deleteAttendanceHoliday(Number(props.id))
    toast.success('删除成功')
    uni.$emit('hrm:attendance:holiday:reload')
    delay(handleBack)
  } catch {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  uni.$on('hrm:attendance:holiday:reload', getDetail)
  getDetail()
})

/** 卸载 */
onUnload(() => {
  uni.$off('hrm:attendance:holiday:reload', getDetail)
})
</script>
