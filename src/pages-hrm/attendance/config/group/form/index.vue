<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="getTitle"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 表单区域 -->
    <view class="pb-160rpx">
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border title="基本信息">
          <wd-form-item title="考勤组名称" title-width="200rpx" prop="name">
            <wd-input
              v-model="formData.name"
              clearable
              placeholder="请输入考勤组名称"
              :maxlength="50"
            />
          </wd-form-item>
          <yd-tree-select
            v-model="formData.deptIds"
            label="适用部门"
            label-width="200rpx"
            placeholder="请选择部门"
            :data="deptOptions"
            :props="treeProps"
            multiple
            check-strictly
          />
          <EmployeeFormPicker
            v-model="formData.employeeIds"
            type="checkbox"
            label="适用员工"
            label-width="200rpx"
            prop="employeeIds"
            placeholder="请选择员工"
          />
        </wd-cell-group>

        <wd-cell-group border title="考勤规则" class="mt-24rpx">
          <wd-cell title="规则类型" value="早晚打卡" />
          <wd-cell title="法定节假日休息" title-width="240rpx">
            <wd-switch v-model="formData.rest" />
          </wd-cell>
        </wd-cell-group>

        <!-- 班次 -->
        <view class="mt-24rpx">
          <view class="mb-16rpx flex items-center justify-between px-24rpx">
            <text class="text-30rpx text-[#333] font-semibold">班次</text>
            <wd-button size="small" type="primary" @click="openShiftForm()">
              新增班次
            </wd-button>
          </view>
          <view
            v-if="!formData.shifts?.length"
            class="mx-24rpx rounded-12rpx bg-white py-60rpx text-center text-28rpx text-[#999] shadow-sm"
          >
            请至少新增一个班次
          </view>
          <view
            v-for="(shift, index) in formData.shifts || []"
            :key="index"
            class="mx-24rpx mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
          >
            <view class="mb-8rpx flex items-start justify-between gap-16rpx">
              <view class="min-w-0 flex-1 text-30rpx text-[#333] font-semibold">
                {{ formatHrmAttendanceWeeks(shift.weeks) }}
              </view>
              <view class="flex shrink-0 gap-8rpx">
                <wd-button size="small" type="primary" variant="text" @click="openShiftForm(index)">
                  编辑
                </wd-button>
                <wd-button size="small" type="danger" variant="text" @click="removeShift(index)">
                  删除
                </wd-button>
              </view>
            </view>
            <view class="text-26rpx text-[#666]">
              {{ shift.startTime }} - {{ shift.endTime }}
            </view>
            <view class="mt-8rpx text-24rpx text-[#999]">
              打卡 {{ shift.clockInStartTime }}-{{ shift.clockInEndTime }} /
              {{ shift.clockOutStartTime }}-{{ shift.clockOutEndTime }}
            </view>
          </view>
        </view>

        <!-- 特殊日期 -->
        <view class="mt-8rpx">
          <view class="mb-16rpx flex items-center justify-between px-24rpx">
            <text class="text-30rpx text-[#333] font-semibold">特殊日期</text>
            <wd-button size="small" type="primary" @click="openSpecialDateForm()">
              添加日期
            </wd-button>
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
            <view class="mb-8rpx flex items-start justify-between gap-16rpx">
              <view class="min-w-0 flex-1 text-30rpx text-[#333] font-semibold">
                {{ formatDate(specialDate.date) || '-' }}
              </view>
              <view class="flex shrink-0 gap-8rpx">
                <wd-button size="small" type="primary" variant="text" @click="openSpecialDateForm(index)">
                  编辑
                </wd-button>
                <wd-button size="small" type="danger" variant="text" @click="removeSpecialDate(index)">
                  删除
                </wd-button>
              </view>
            </view>
            <view class="text-26rpx text-[#666]">
              {{ formatHrmAttendanceSpecialDate(specialDate, formData.shifts) }}
            </view>
          </view>
        </view>

        <!-- 打卡方式 -->
        <wd-cell-group border title="打卡方式" class="mt-24rpx">
          <wd-cell title="定位打卡" title-width="200rpx">
            <wd-switch v-model="formData.openPointCard" />
          </wd-cell>
          <wd-cell title="WiFi 打卡" title-width="200rpx">
            <wd-switch v-model="formData.openWifiCard" />
          </wd-cell>
        </wd-cell-group>

        <view v-if="formData.openPointCard" class="mt-24rpx">
          <view class="mb-16rpx flex items-center justify-between px-24rpx">
            <text class="text-30rpx text-[#333] font-semibold">打卡地点</text>
            <wd-button size="small" type="primary" @click="openPointForm()">
              新增地点
            </wd-button>
          </view>
          <view
            v-if="!formData.points?.length"
            class="mx-24rpx rounded-12rpx bg-white py-60rpx text-center text-28rpx text-[#999] shadow-sm"
          >
            请新增打卡地点
          </view>
          <view
            v-for="(point, index) in formData.points || []"
            :key="index"
            class="mx-24rpx mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
          >
            <view class="mb-8rpx flex items-start justify-between gap-16rpx">
              <view class="min-w-0 flex-1 text-30rpx text-[#333] font-semibold">
                {{ point.name || '-' }}
              </view>
              <view class="flex shrink-0 gap-8rpx">
                <wd-button size="small" type="primary" variant="text" @click="openPointForm(index)">
                  编辑
                </wd-button>
                <wd-button size="small" type="danger" variant="text" @click="removePoint(index)">
                  删除
                </wd-button>
              </view>
            </view>
            <view class="text-26rpx text-[#666]">
              {{ point.address || '-' }}
            </view>
            <view class="mt-8rpx text-24rpx text-[#999]">
              {{ point.longitude }}, {{ point.latitude }} · {{ point.radius }} 米
            </view>
          </view>
        </view>

        <view v-if="formData.openWifiCard" class="mt-24rpx">
          <view class="mb-16rpx flex items-center justify-between px-24rpx">
            <text class="text-30rpx text-[#333] font-semibold">打卡 WiFi</text>
            <wd-button size="small" type="primary" @click="openWifiForm()">
              新增 WiFi
            </wd-button>
          </view>
          <view
            v-if="!formData.wifis?.length"
            class="mx-24rpx rounded-12rpx bg-white py-60rpx text-center text-28rpx text-[#999] shadow-sm"
          >
            请新增打卡 WiFi
          </view>
          <view
            v-for="(wifi, index) in formData.wifis || []"
            :key="index"
            class="mx-24rpx mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
          >
            <view class="mb-8rpx flex items-start justify-between gap-16rpx">
              <view class="min-w-0 flex-1 text-30rpx text-[#333] font-semibold">
                {{ wifi.ssid || '-' }}
              </view>
              <view class="flex shrink-0 gap-8rpx">
                <wd-button size="small" type="primary" variant="text" @click="openWifiForm(index)">
                  编辑
                </wd-button>
                <wd-button size="small" type="danger" variant="text" @click="removeWifi(index)">
                  删除
                </wd-button>
              </view>
            </view>
            <view class="text-26rpx text-[#666]">
              {{ wifi.mac || '-' }}
            </view>
          </view>
        </view>

        <!-- 扣款规则 -->
        <wd-cell-group border title="扣款规则" class="mt-24rpx">
          <view class="mx-24rpx mb-16rpx rounded-12rpx bg-[#e6f4ff] px-24rpx py-16rpx text-24rpx text-[#1677ff]">
            扣款金额单位：按分钟为元/分钟，按次数为元/次，每月固定为元/月，旷工按元/天。
          </view>
          <yd-form-picker
            v-model="formData.deductRule.lateMethod"
            label="迟到规则"
            label-width="200rpx"
            prop="deductRule.lateMethod"
            :dict-type="DICT_TYPE.HRM_ATTENDANCE_LATE_EARLY_DEDUCT_METHOD"
            placeholder="请选择迟到规则"
          />
          <wd-form-item title="迟到金额" title-width="200rpx" prop="deductRule.lateDeductMoney">
            <view class="flex items-center gap-12rpx">
              <wd-input-number
                v-model="formData.deductRule.lateDeductMoney"
                allow-null
                :min="0"
                :precision="2"
              />
              <text class="shrink-0 text-26rpx text-[#666]">
                元/{{ formatHrmAttendanceDeductUnit(formData.deductRule.lateMethod) }}
              </text>
            </view>
          </wd-form-item>
          <yd-form-picker
            v-model="formData.deductRule.earlyMethod"
            label="早退规则"
            label-width="200rpx"
            prop="deductRule.earlyMethod"
            :dict-type="DICT_TYPE.HRM_ATTENDANCE_LATE_EARLY_DEDUCT_METHOD"
            placeholder="请选择早退规则"
          />
          <wd-form-item title="早退金额" title-width="200rpx" prop="deductRule.earlyDeductMoney">
            <view class="flex items-center gap-12rpx">
              <wd-input-number
                v-model="formData.deductRule.earlyDeductMoney"
                allow-null
                :min="0"
                :precision="2"
              />
              <text class="shrink-0 text-26rpx text-[#666]">
                元/{{ formatHrmAttendanceDeductUnit(formData.deductRule.earlyMethod) }}
              </text>
            </view>
          </wd-form-item>
          <yd-form-picker
            v-model="formData.deductRule.absenteeismMethod"
            label="旷工规则"
            label-width="200rpx"
            prop="deductRule.absenteeismMethod"
            :dict-type="DICT_TYPE.HRM_ATTENDANCE_ABSENTEEISM_DEDUCT_METHOD"
            placeholder="请选择旷工规则"
          />
          <wd-form-item title="旷工金额" title-width="200rpx" prop="deductRule.absenteeismDeductMoney">
            <view class="flex items-center gap-12rpx">
              <wd-input-number
                v-model="formData.deductRule.absenteeismDeductMoney"
                allow-null
                :min="0"
                :precision="2"
              />
              <text class="shrink-0 text-26rpx text-[#666]">元/天</text>
            </view>
          </wd-form-item>
          <yd-form-picker
            v-model="formData.deductRule.misscardMethod"
            label="缺卡规则"
            label-width="200rpx"
            prop="deductRule.misscardMethod"
            :dict-type="DICT_TYPE.HRM_ATTENDANCE_MISSCARD_DEDUCT_METHOD"
            placeholder="请选择缺卡规则"
          />
          <wd-form-item title="缺卡金额" title-width="200rpx" prop="deductRule.misscardDeductMoney">
            <view class="flex items-center gap-12rpx">
              <wd-input-number
                v-model="formData.deductRule.misscardDeductMoney"
                allow-null
                :min="0"
                :precision="2"
              />
              <text class="shrink-0 text-26rpx text-[#666]">元/次</text>
            </view>
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
    </view>

    <!-- 底部保存按钮 -->
    <view class="yd-detail-footer">
      <wd-button type="primary" block :loading="formLoading" @click="handleSubmit">
        保存
      </wd-button>
    </view>

    <ShiftForm ref="shiftFormRef" @confirm="handleShiftConfirm" />
    <SpecialDateForm ref="specialDateFormRef" @confirm="handleSpecialDateConfirm" />
    <PointForm ref="pointFormRef" @confirm="handlePointConfirm" />
    <WifiForm ref="wifiFormRef" @confirm="handleWifiConfirm" />
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { Dept } from '@/api/system/dept'
import type {
  AttendanceDeductRule,
  AttendanceGroup,
  AttendancePoint,
  AttendanceShift,
  AttendanceSpecialDate,
  AttendanceWifi,
} from '@/api/hrm/attendance/group'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import {
  createAttendanceGroup,
  getAttendanceGroup,
  updateAttendanceGroup,
} from '@/api/hrm/attendance/group'
import { getSimpleDeptList } from '@/api/system/dept'
import EmployeeFormPicker from '@/pages-hrm/employee/components/employee-form-picker.vue'
import {
  HRM_ATTENDANCE_POINT_RADIUS_OPTIONS,
  HrmAttendanceAbsenteeismDeductMethod,
  HrmAttendanceLateEarlyDeductMethod,
  HrmAttendanceMisscardDeductMethod,
} from '@/pages-hrm/utils/constants'
import {
  formatHrmAttendanceDeductUnit,
  formatHrmAttendanceSpecialDate,
  formatHrmAttendanceWeeks,
} from '@/pages-hrm/utils/format'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate } from '@/utils/date'
import { handleTree } from '@/utils/tree'
import { createFormSchema } from '@/utils/wot'
import PointForm from '../components/point-form.vue'
import ShiftForm from '../components/shift-form.vue'
import SpecialDateForm from '../components/special-date-form.vue'
import WifiForm from '../components/wifi-form.vue'

type AttendanceGroupFormData = AttendanceGroup & {
  deductRule: AttendanceDeductRule
}

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
const getTitle = computed(() => props.id ? '编辑考勤组' : '新增考勤组')
const formLoading = ref(false) // 表单提交状态
const formRef = ref<FormInstance>() // 表单组件引用
const deptList = ref<Dept[]>([]) // 部门列表
const formData = ref<AttendanceGroupFormData>(createDefaultFormData()) // 表单数据
const shiftFormRef = ref<InstanceType<typeof ShiftForm>>() // 班次表单
const specialDateFormRef = ref<InstanceType<typeof SpecialDateForm>>() // 特殊日期表单
const pointFormRef = ref<InstanceType<typeof PointForm>>() // 地点表单
const wifiFormRef = ref<InstanceType<typeof WifiForm>>() // WiFi 表单
const currentShiftIndex = ref<number>() // 当前班次下标
const currentSpecialDateIndex = ref<number>() // 当前特殊日期下标
const currentPointIndex = ref<number>() // 当前地点下标
const currentWifiIndex = ref<number>() // 当前 WiFi 下标
const treeProps = {
  children: 'children',
  label: 'name',
  value: 'id',
} // 树字段映射
const deptOptions = computed(() => handleTree(deptList.value)) // 部门树形选项
const formSchema = createFormSchema({
  'name': [{ required: true, message: '考勤组名称不能为空' }],
  'deductRule.lateMethod': [{ required: true, message: '请选择迟到规则' }],
  'deductRule.lateDeductMoney': [{ required: true, message: '请输入迟到扣款金额' }],
  'deductRule.earlyMethod': [{ required: true, message: '请选择早退规则' }],
  'deductRule.earlyDeductMoney': [{ required: true, message: '请输入早退扣款金额' }],
  'deductRule.absenteeismMethod': [{ required: true, message: '请选择旷工规则' }],
  'deductRule.absenteeismDeductMoney': [{ required: true, message: '请输入旷工扣款金额' }],
  'deductRule.misscardMethod': [{ required: true, message: '请选择缺卡规则' }],
  'deductRule.misscardDeductMoney': [{ required: true, message: '请输入缺卡扣款金额' }],
})
const macPattern = /^(?:[0-9a-f]{2}(?::[0-9a-f]{2}){5}|[0-9a-f]{2}(?:-[0-9a-f]{2}){5})$/i // MAC 地址格式

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-hrm/attendance/config/group/index')
}

/** 加载基础选项 */
async function loadOptions() {
  deptList.value = await getSimpleDeptList()
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  const data = await getAttendanceGroup(Number(props.id))
  formData.value = {
    ...createDefaultFormData(),
    ...data,
    deptIds: data.deptIds || [],
    employeeIds: data.employeeIds || [],
    shifts: data.shifts || [],
    specialDates: data.specialDates || [],
    points: data.points || [],
    wifis: data.wifis || [],
    deductRule: {
      ...createDefaultDeductRule(),
      ...(data.deductRule || {}),
    },
  }
}

/** 打开班次表单 */
function openShiftForm(index?: number) {
  currentShiftIndex.value = index
  shiftFormRef.value?.open(index === undefined ? undefined : formData.value.shifts?.[index])
}

/** 保存班次 */
function handleShiftConfirm(shift: AttendanceShift) {
  const duplicatedWeek = formData.value.shifts?.some(
    (item, index) =>
      index !== currentShiftIndex.value && item.weeks.some(week => shift.weeks.includes(week)),
  )
  if (duplicatedWeek) {
    toast.warning('同一个工作日只能配置一个班次')
    return
  }
  if (currentShiftIndex.value === undefined) {
    formData.value.shifts?.push(shift)
  } else {
    formData.value.shifts?.splice(currentShiftIndex.value, 1, shift)
  }
}

/** 删除班次 */
function removeShift(index: number) {
  formData.value.shifts?.splice(index, 1)
}

/** 打开特殊日期表单 */
function openSpecialDateForm(index?: number) {
  currentSpecialDateIndex.value = index
  specialDateFormRef.value?.open(
    index === undefined ? undefined : formData.value.specialDates?.[index],
  )
}

/** 保存特殊日期 */
function handleSpecialDateConfirm(specialDate: AttendanceSpecialDate) {
  const duplicatedDate = formData.value.specialDates?.some(
    (item, index) =>
      index !== currentSpecialDateIndex.value && Number(item.date) === Number(specialDate.date),
  )
  if (duplicatedDate) {
    toast.warning('特殊日期不能重复')
    return
  }
  if (currentSpecialDateIndex.value === undefined) {
    formData.value.specialDates?.push(specialDate)
  } else {
    formData.value.specialDates?.splice(currentSpecialDateIndex.value, 1, specialDate)
  }
}

/** 删除特殊日期 */
function removeSpecialDate(index: number) {
  formData.value.specialDates?.splice(index, 1)
}

/** 打开地点表单 */
function openPointForm(index?: number) {
  currentPointIndex.value = index
  pointFormRef.value?.open(index === undefined ? undefined : formData.value.points?.[index])
}

/** 保存地点 */
function handlePointConfirm(point: AttendancePoint) {
  if (currentPointIndex.value === undefined) {
    formData.value.points?.push(point)
  } else {
    formData.value.points?.splice(currentPointIndex.value, 1, point)
  }
}

/** 删除地点 */
function removePoint(index: number) {
  formData.value.points?.splice(index, 1)
}

/** 打开 WiFi 表单 */
function openWifiForm(index?: number) {
  currentWifiIndex.value = index
  wifiFormRef.value?.open(index === undefined ? undefined : formData.value.wifis?.[index])
}

/** 保存 WiFi */
function handleWifiConfirm(wifi: AttendanceWifi) {
  if (currentWifiIndex.value === undefined) {
    formData.value.wifis?.push(wifi)
  } else {
    formData.value.wifis?.splice(currentWifiIndex.value, 1, wifi)
  }
}

/** 删除 WiFi */
function removeWifi(index: number) {
  formData.value.wifis?.splice(index, 1)
}

/** 校验已开启打卡方式的配置是否完整 */
function validateCardSettings() {
  if (!formData.value.openPointCard && !formData.value.openWifiCard) {
    toast.warning('请至少启用定位打卡或 WiFi 打卡')
    return false
  }
  if (formData.value.openPointCard) {
    const points = formData.value.points || []
    const invalidPoint
      = points.length === 0
        || points.some(
          point =>
            !point.name?.trim()
            || !point.address?.trim()
            || point.latitude === undefined
            || point.longitude === undefined
            || !Number.isFinite(point.latitude)
            || point.latitude < -90
            || point.latitude > 90
            || !Number.isFinite(point.longitude)
            || point.longitude < -180
            || point.longitude > 180
            || !point.radius
            || !(HRM_ATTENDANCE_POINT_RADIUS_OPTIONS as readonly number[]).includes(point.radius),
        )
    if (invalidPoint) {
      toast.warning('请完整填写定位地点、地址、有效经纬度和打卡范围')
      return false
    }
  }
  if (formData.value.openWifiCard) {
    const wifis = formData.value.wifis || []
    if (
      wifis.length === 0
      || wifis.some(wifi => !wifi.ssid?.trim() || !wifi.mac || !macPattern.test(wifi.mac))
    ) {
      toast.warning('请完整填写 WiFi 名称和正确的 MAC 地址')
      return false
    }
  }
  return true
}

/** 提交表单 */
async function handleSubmit() {
  formData.value.deptIds = (formData.value.deptIds || []).map(Number)
  formData.value.employeeIds = (formData.value.employeeIds || []).map(Number)

  if (!formData.value.deptIds.length && !formData.value.employeeIds.length) {
    toast.warning('至少选择一个适用部门或员工')
    return
  }
  if (!formData.value.shifts?.length) {
    toast.warning('请至少新增一个班次')
    return
  }
  if (!validateCardSettings()) {
    return
  }

  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }

  formLoading.value = true
  try {
    const data = {
      ...formData.value,
      points: formData.value.openPointCard ? formData.value.points : [],
      wifis: formData.value.openWifiCard ? formData.value.wifis : [],
    }
    if (props.id) {
      await updateAttendanceGroup(data)
      toast.success('修改成功')
    } else {
      await createAttendanceGroup(data)
      toast.success('新增成功')
    }
    uni.$emit('hrm:attendance:group:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 创建默认扣款规则 */
function createDefaultDeductRule(): AttendanceDeductRule {
  return {
    lateMethod: HrmAttendanceLateEarlyDeductMethod.FIXED_MONTH,
    lateDeductMoney: 0,
    earlyMethod: HrmAttendanceLateEarlyDeductMethod.FIXED_MONTH,
    earlyDeductMoney: 0,
    absenteeismMethod: HrmAttendanceAbsenteeismDeductMethod.BY_DAY,
    absenteeismDeductMoney: 0,
    misscardMethod: HrmAttendanceMisscardDeductMethod.BY_COUNT,
    misscardDeductMoney: 0,
  }
}

/** 创建默认考勤组表单数据 */
function createDefaultFormData(): AttendanceGroupFormData {
  return {
    id: undefined,
    name: '',
    openPointCard: false,
    openWifiCard: false,
    rest: true,
    deptIds: [],
    employeeIds: [],
    shifts: [
      {
        weeks: [1, 2, 3, 4, 5],
        startTime: '09:00',
        endTime: '18:00',
        clockInStartTime: '05:00',
        clockInEndTime: '17:59',
        clockOutStartTime: '09:01',
        clockOutEndTime: '04:59',
        restStartTime: '12:00',
        restEndTime: '13:00',
        excludeRestTime: false,
      },
    ],
    specialDates: [],
    points: [],
    wifis: [],
    deductRule: createDefaultDeductRule(),
  }
}

/** 初始化 */
onMounted(async () => {
  await loadOptions()
  await getDetail()
})
</script>
