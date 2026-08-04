<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="考勤组详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view class="pb-160rpx">
      <wd-cell-group border title="基本信息">
        <wd-cell title="考勤组名称" :value="formData.name || '-'" />
        <wd-cell title="默认考勤组" :value="formData.defaultStatus ? '是' : '否'" />
        <wd-cell title="适用范围" :value="formatAttendanceGroupScope(formData)" />
        <wd-cell title="创建时间" :value="formatDateTime(formData.createTime) || '-'" />
      </wd-cell-group>

      <wd-cell-group border title="考勤规则" class="mt-24rpx">
        <wd-cell title="规则类型" value="早晚打卡" />
        <wd-cell title="法定节假日休息" :value="formData.rest ? '是' : '否'" />
      </wd-cell-group>

      <view class="mt-24rpx">
        <view class="mb-16rpx px-24rpx text-30rpx text-[#333] font-semibold">
          班次
        </view>
        <view
          v-if="!formData.shifts?.length"
          class="mx-24rpx rounded-12rpx bg-white py-60rpx text-center text-28rpx text-[#999] shadow-sm"
        >
          暂无班次
        </view>
        <view
          v-for="(shift, index) in formData.shifts || []"
          :key="index"
          class="mx-24rpx mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
        >
          <view class="mb-8rpx text-30rpx text-[#333] font-semibold">
            {{ formatHrmAttendanceWeeks(shift.weeks) }}
          </view>
          <view class="text-26rpx text-[#666]">
            上下班 {{ shift.startTime }} - {{ shift.endTime }}
          </view>
          <view class="mt-8rpx text-26rpx text-[#666]">
            上班打卡 {{ shift.clockInStartTime }} - {{ shift.clockInEndTime }}
          </view>
          <view class="mt-8rpx text-26rpx text-[#666]">
            下班打卡 {{ shift.clockOutStartTime }} - {{ shift.clockOutEndTime }}
          </view>
          <view class="mt-8rpx text-26rpx text-[#666]">
            休息 {{ shift.restStartTime }} - {{ shift.restEndTime }}
            {{ shift.excludeRestTime ? '（不计入工时）' : '' }}
          </view>
        </view>
      </view>

      <view class="mt-8rpx">
        <view class="mb-16rpx px-24rpx text-30rpx text-[#333] font-semibold">
          特殊日期
        </view>
        <view
          v-if="!formData.specialDates?.length"
          class="mx-24rpx rounded-12rpx bg-white py-60rpx text-center text-28rpx text-[#999] shadow-sm"
        >
          暂无特殊日期
        </view>
        <view
          v-for="(specialDate, index) in formData.specialDates || []"
          :key="index"
          class="mx-24rpx mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
        >
          <view class="mb-8rpx text-30rpx text-[#333] font-semibold">
            {{ formatDate(specialDate.date) || '-' }}
          </view>
          <view class="text-26rpx text-[#666]">
            {{ formatHrmAttendanceSpecialDate(specialDate, formData.shifts) }}
          </view>
        </view>
      </view>

      <wd-cell-group border title="打卡方式" class="mt-24rpx">
        <wd-cell title="定位打卡" :value="formData.openPointCard ? '已启用' : '未启用'" />
        <wd-cell title="WiFi 打卡" :value="formData.openWifiCard ? '已启用' : '未启用'" />
      </wd-cell-group>

      <view v-if="formData.openPointCard" class="mt-24rpx">
        <view class="mb-16rpx px-24rpx text-30rpx text-[#333] font-semibold">
          打卡地点
        </view>
        <view
          v-for="(point, index) in formData.points || []"
          :key="index"
          class="mx-24rpx mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
        >
          <view class="mb-8rpx text-30rpx text-[#333] font-semibold">
            {{ point.name || '-' }}
          </view>
          <view class="text-26rpx text-[#666]">
            {{ point.address || '-' }}
          </view>
          <view class="mt-8rpx text-26rpx text-[#666]">
            经纬度 {{ formatPointCoordinate(point) }} · 范围 {{ point.radius ?? '-' }} 米
          </view>
        </view>
      </view>

      <view v-if="formData.openWifiCard" class="mt-24rpx">
        <view class="mb-16rpx px-24rpx text-30rpx text-[#333] font-semibold">
          打卡 WiFi
        </view>
        <view
          v-for="(wifi, index) in formData.wifis || []"
          :key="index"
          class="mx-24rpx mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
        >
          <view class="mb-8rpx text-30rpx text-[#333] font-semibold">
            {{ wifi.ssid || '-' }}
          </view>
          <view class="text-26rpx text-[#666]">
            MAC {{ wifi.mac || '-' }}
          </view>
        </view>
      </view>

      <wd-cell-group border title="扣款规则" class="mt-24rpx">
        <wd-cell title="迟到规则">
          <dict-tag
            v-if="formData.deductRule?.lateMethod != null"
            :type="DICT_TYPE.HRM_ATTENDANCE_LATE_EARLY_DEDUCT_METHOD"
            :value="formData.deductRule.lateMethod"
          />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell
          title="迟到金额"
          :value="formatDeductMoney(formData.deductRule?.lateDeductMoney, formData.deductRule?.lateMethod)"
        />
        <wd-cell title="早退规则">
          <dict-tag
            v-if="formData.deductRule?.earlyMethod != null"
            :type="DICT_TYPE.HRM_ATTENDANCE_LATE_EARLY_DEDUCT_METHOD"
            :value="formData.deductRule.earlyMethod"
          />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell
          title="早退金额"
          :value="formatDeductMoney(formData.deductRule?.earlyDeductMoney, formData.deductRule?.earlyMethod)"
        />
        <wd-cell title="旷工规则">
          <dict-tag
            v-if="formData.deductRule?.absenteeismMethod != null"
            :type="DICT_TYPE.HRM_ATTENDANCE_ABSENTEEISM_DEDUCT_METHOD"
            :value="formData.deductRule.absenteeismMethod"
          />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell
          title="旷工金额"
          :value="`${formData.deductRule?.absenteeismDeductMoney ?? 0} 元/天`"
        />
        <wd-cell title="缺卡规则">
          <dict-tag
            v-if="formData.deductRule?.misscardMethod != null"
            :type="DICT_TYPE.HRM_ATTENDANCE_MISSCARD_DEDUCT_METHOD"
            :value="formData.deductRule.misscardMethod"
          />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell
          title="缺卡金额"
          :value="`${formData.deductRule?.misscardDeductMoney ?? 0} 元/次`"
        />
      </wd-cell-group>
    </view>

    <!-- 底部操作按钮 -->
    <view v-if="hasFooter" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button
          v-if="hasAccessByCodes(['hrm:attendance:group:update'])"
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
import type { AttendanceGroup, AttendancePoint } from '@/api/hrm/attendance/group'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { deleteAttendanceGroup, getAttendanceGroup } from '@/api/hrm/attendance/group'
import { useAccess } from '@/hooks/useAccess'
import {
  formatAttendanceGroupScope,
  formatHrmAttendanceDeductUnit,
  formatHrmAttendanceSpecialDate,
  formatHrmAttendanceWeeks,
} from '@/pages-hrm/utils/format'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate, formatDateTime } from '@/utils/date'

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
const formData = ref<AttendanceGroup>({ // 详情数据
  name: '',
})
const deleting = ref(false) // 删除中
const canDelete = computed(() => { // 非默认组可删
  return !formData.value.defaultStatus && hasAccessByCodes(['hrm:attendance:group:delete'])
})
const hasFooter = computed(() => { // 底部操作区
  return hasAccessByCodes(['hrm:attendance:group:update']) || canDelete.value
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-hrm/attendance/config/group/index')
}

/** 格式化经纬度 */
function formatPointCoordinate(point: AttendancePoint) {
  if (point.longitude === undefined || point.latitude === undefined) {
    return '-'
  }
  return `${point.longitude}, ${point.latitude}`
}

/** 格式化扣款金额 */
function formatDeductMoney(money?: number, method?: number) {
  return `${money ?? 0} 元/${formatHrmAttendanceDeductUnit(method)}`
}

/** 加载详情 */
async function getDetail() {
  if (!props.id || deleting.value) {
    return
  }
  formData.value = await getAttendanceGroup(Number(props.id))
}

/** 编辑 */
function handleEdit() {
  uni.navigateTo({
    url: `/pages-hrm/attendance/config/group/form/index?id=${props.id}`,
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
      msg: `确认删除考勤组「${formData.value.name}」吗？`,
    })
  } catch {
    return
  }

  deleting.value = true
  try {
    await deleteAttendanceGroup(Number(props.id))
    toast.success('删除成功')
    uni.$emit('hrm:attendance:group:reload')
    delay(handleBack)
  } catch {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  uni.$on('hrm:attendance:group:reload', getDetail)
  getDetail()
})

/** 卸载 */
onUnload(() => {
  uni.$off('hrm:attendance:group:reload', getDetail)
})
</script>
