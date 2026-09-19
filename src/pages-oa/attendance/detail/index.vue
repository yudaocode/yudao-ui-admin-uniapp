<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="考勤详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <wd-cell-group border>
      <wd-cell title="成员" :value="formData?.userName || '-'" />
      <wd-cell title="部门" :value="formData?.deptName || '-'" />
      <wd-cell title="考勤类型">
        <dict-tag v-if="formData" :type="DICT_TYPE.OA_ATTENDANCE_TYPE" :value="formData.type" />
      </wd-cell>
      <wd-cell title="考勤状态">
        <dict-tag v-if="formData" :type="DICT_TYPE.OA_ATTENDANCE_STATUS" :value="formData.status" />
      </wd-cell>
      <wd-cell title="考勤时间" :value="formatDateTime(formData?.attendanceTime) || '-'" />
      <wd-cell title="考勤IP" :value="formData?.attendanceIp || '-'" />
      <wd-cell title="备注" :value="formData?.remark || '-'" />
      <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
    </wd-cell-group>

    <!-- 底部操作按钮 -->
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button
          v-if="hasAccessByCodes(['oa:attendance:update'])"
          class="flex-1" type="warning" @click="handleOpenEdit"
        >
          修改状态
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['oa:attendance:delete'])"
          class="flex-1" type="danger" :loading="deleting" @click="handleDelete"
        >
          删除
        </wd-button>
      </view>
    </view>

    <!-- 修改状态弹窗：状态选项按考勤类型限定，上班仅正常/迟到，下班仅正常/早退 -->
    <wd-popup
      v-model="editVisible"
      position="bottom"
      root-portal
      custom-style="border-radius: 24rpx 24rpx 0 0;"
      @close="editVisible = false"
    >
      <view class="p-24rpx">
        <view class="mb-16rpx text-32rpx text-[#333] font-semibold">
          修改考勤状态
        </view>
        <view class="mb-16rpx flex items-center justify-between rounded-12rpx bg-[#f5f5f5] px-24rpx py-20rpx" @click="statusPickerVisible = true">
          <text class="text-28rpx text-[#999]">考勤状态</text>
          <text class="text-28rpx" :class="editStatus === undefined ? 'text-[#999]' : 'text-[#333]'">
            {{ editStatus === undefined ? '请选择状态' : getDictLabel(DICT_TYPE.OA_ATTENDANCE_STATUS, editStatus) }}
          </text>
        </view>
        <wd-textarea
          v-model="editRemark"
          :maxlength="500"
          show-word-limit
          placeholder="请输入备注"
        />
        <wd-button
          class="mt-24rpx"
          type="primary"
          block
          :loading="updating"
          @click="handleSubmitEdit"
        >
          保存
        </wd-button>
      </view>
    </wd-popup>
    <wd-picker
      v-model="editStatus"
      v-model:visible="statusPickerVisible"
      :columns="statusOptions"
      title="考勤状态"
    />
  </view>
</template>

<script lang="ts" setup>
import type { Attendance } from '@/api/oa/attendance'
import { onUnload } from '@dcloudio/uni-app'
import { computed, onMounted, ref } from 'vue'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { deleteAttendance, getAttendance, updateAttendance } from '@/api/oa/attendance'
import { useAccess } from '@/hooks/useAccess'
import { getDictLabel } from '@/hooks/useDict'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { OA_ATTENDANCE_STATUS, OA_ATTENDANCE_TYPE } from '../../utils/constants'

const props = defineProps<{
  id?: string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const formData = ref<Attendance>() // 详情数据
const deleting = ref(false) // 删除状态
const editVisible = ref(false) // 修改状态弹窗显示状态
const editStatus = ref<number>() // 修改的状态
const editRemark = ref('') // 修改的备注
const updating = ref(false) // 修改提交状态
const statusPickerVisible = ref(false) // 状态选择器显示状态
const statusOptions = computed(() => { // 状态选项按考勤类型限定：上班仅正常/迟到，下班仅正常/早退，请假/出差仅对应状态
  const values = {
    [OA_ATTENDANCE_TYPE.CLOCK_IN]: [OA_ATTENDANCE_STATUS.NORMAL, OA_ATTENDANCE_STATUS.LATE],
    [OA_ATTENDANCE_TYPE.CLOCK_OUT]: [OA_ATTENDANCE_STATUS.NORMAL, OA_ATTENDANCE_STATUS.EARLY],
    [OA_ATTENDANCE_TYPE.LEAVE]: [OA_ATTENDANCE_STATUS.LEAVE],
    [OA_ATTENDANCE_TYPE.TRAVEL]: [OA_ATTENDANCE_STATUS.TRAVEL],
  }[formData.value?.type ?? 0] ?? []
  return values.map(value => ({ label: getDictLabel(DICT_TYPE.OA_ATTENDANCE_STATUS, value), value }))
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 加载考勤详情 */
async function getDetail() {
  if (!props.id || deleting.value) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getAttendance(Number(props.id))
  } finally {
    toast.close()
  }
}

/** 打开修改状态弹窗 */
function handleOpenEdit() {
  editStatus.value = formData.value?.status
  editRemark.value = formData.value?.remark ?? ''
  editVisible.value = true
}

/** 提交修改 */
async function handleSubmitEdit() {
  if (!props.id) {
    return
  }
  if (editStatus.value === undefined) {
    toast.warning('请选择考勤状态')
    return
  }
  updating.value = true
  try {
    await updateAttendance({
      id: Number(props.id),
      status: editStatus.value,
      remark: editRemark.value.trim() || undefined,
    })
    toast.success('修改成功')
    editVisible.value = false
    uni.$emit('oa:attendance:reload')
  } finally {
    updating.value = false
  }
}

/** 删除考勤记录 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定要删除该考勤记录吗？',
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteAttendance(Number(props.id))
    toast.success('删除成功')
    uni.$emit('oa:attendance:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  uni.$on('oa:attendance:reload', getDetail)
  getDetail()
})

/** 卸载 */
onUnload(() => {
  uni.$off('oa:attendance:reload', getDetail)
})
</script>
