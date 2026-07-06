<template>
  <!-- 搜索框入口 -->
  <view @click="visible = true">
    <wd-search :placeholder="placeholder" hide-cancel disabled />
  </view>

  <!-- 搜索弹窗 -->
  <wd-popup
    v-model="visible"
    position="top"
    :custom-style="getTopPopupStyle()"
    :modal-style="getTopPopupModalStyle()"
    @close="visible = false"
  >
    <view class="yd-search-form-container">
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          点检方案
        </view>
        <view class="min-h-72rpx flex items-center gap-12rpx rounded-8rpx bg-[#f7f8fa] px-24rpx text-28rpx" @click="openPlanPicker">
          <text v-if="selectedPlanText" class="min-w-0 flex-1 truncate text-[#333]">
            {{ selectedPlanText }}
          </text>
          <text v-else class="min-w-0 flex-1 truncate text-[#999]">
            请选择点检方案
          </text>
          <wd-icon
            v-if="selectedPlanText"
            name="close-circle"
            size="30rpx"
            custom-style="color: #c0c4cc;"
            @click.stop="clearPlan"
          />
        </view>
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          设备
        </view>
        <view class="min-h-72rpx flex items-center gap-12rpx rounded-8rpx bg-[#f7f8fa] px-24rpx text-28rpx" @click="openMachineryPicker">
          <text v-if="selectedMachineryText" class="min-w-0 flex-1 truncate text-[#333]">
            {{ selectedMachineryText }}
          </text>
          <text v-else class="min-w-0 flex-1 truncate text-[#999]">
            请选择设备
          </text>
          <wd-icon
            v-if="selectedMachineryText"
            name="close-circle"
            size="30rpx"
            custom-style="color: #c0c4cc;"
            @click.stop="clearMachinery"
          />
        </view>
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          点检人
        </view>
        <UserPicker ref="userPickerRef" v-model="formData.userId" type="radio" placeholder="请选择点检人" />
      </view>
      <yd-search-picker v-model="formData.status" label="状态" :dict-type="DICT_TYPE.MES_DV_CHECK_RECORD_STATUS" all-option />
      <yd-search-date-range v-model="checkTimeRange" label="点检时间" />
      <view class="yd-search-form-actions">
        <wd-button class="flex-1" variant="plain" @click="handleReset">
          重置
        </wd-button>
        <wd-button class="flex-1" type="primary" @click="handleSearch">
          搜索
        </wd-button>
      </view>
    </view>
  </wd-popup>

  <CheckPlanPicker ref="planPickerRef" @confirm="handlePlanConfirm" />
  <MachineryPicker ref="machineryPickerRef" @confirm="handleMachineryConfirm" />
</template>

<script lang="ts" setup>
import type { DvCheckPlan } from '@/api/mes/dv/checkplan'
import type { DvMachinery } from '@/api/mes/dv/machinery'
import { computed, reactive, ref } from 'vue'
import { getDictLabel } from '@/hooks/useDict'
import UserPicker from '@/components/system-select/user-picker.vue'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateRange } from '@/utils/date'
import CheckPlanPicker from '../../checkplan/components/checkplan-picker.vue'
import MachineryPicker from '../../machinery/components/machinery-picker.vue'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const planPickerRef = ref<InstanceType<typeof CheckPlanPicker>>() // 点检方案选择器
const machineryPickerRef = ref<InstanceType<typeof MachineryPicker>>() // 设备选择器
const userPickerRef = ref<InstanceType<typeof UserPicker>>() // 点检人选择器
const selectedPlan = ref<DvCheckPlan>() // 已选方案
const selectedMachinery = ref<DvMachinery>() // 已选设备
const checkTimeRange = ref<[number | undefined, number | undefined]>([undefined, undefined]) // 点检时间范围
const formData = reactive<Record<string, any>>({
  planId: undefined,
  machineryId: undefined,
  userId: undefined,
  status: -1,
}) // 搜索表单数据
const selectedPlanText = computed(() => {
  return selectedPlan.value
    ? `${selectedPlan.value.code || '-'} / ${selectedPlan.value.name || '-'}`
    : ''
})
const selectedMachineryText = computed(() => {
  return selectedMachinery.value
    ? `${selectedMachinery.value.code || '-'} / ${selectedMachinery.value.name || '-'}`
    : ''
})

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (selectedPlan.value) {
    conditions.push(`方案:${selectedPlan.value.code || selectedPlan.value.name}`)
  }
  if (selectedMachinery.value) {
    conditions.push(`设备:${selectedMachinery.value.code || selectedMachinery.value.name}`)
  }
  const userName = userPickerRef.value?.getUserNickname(formData.userId)
  if (userName) {
    conditions.push(`点检人:${userName}`)
  }
  if (formData.status !== -1) {
    conditions.push(`状态:${getDictLabel(DICT_TYPE.MES_DV_CHECK_RECORD_STATUS, formData.status)}`)
  }
  if (formatDateRange(checkTimeRange.value)) {
    conditions.push('点检时间')
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索点检记录'
})

/** 打开方案选择器 */
function openPlanPicker() {
  planPickerRef.value?.open()
}

/** 打开设备选择器 */
function openMachineryPicker() {
  machineryPickerRef.value?.open()
}

/** 选择方案 */
function handlePlanConfirm(item: DvCheckPlan) {
  selectedPlan.value = item
  formData.planId = item.id
}

/** 选择设备 */
function handleMachineryConfirm(item: DvMachinery) {
  selectedMachinery.value = item
  formData.machineryId = item.id
}

/** 清空方案 */
function clearPlan() {
  selectedPlan.value = undefined
  formData.planId = undefined
}

/** 清空设备 */
function clearMachinery() {
  selectedMachinery.value = undefined
  formData.machineryId = undefined
}

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    planId: formData.planId || undefined,
    machineryId: formData.machineryId || undefined,
    userId: formData.userId || undefined,
    status: formData.status === -1 ? undefined : formData.status,
    checkTime: formatDateRange(checkTimeRange.value),
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.planId = undefined
  formData.machineryId = undefined
  formData.userId = undefined
  formData.status = -1
  selectedPlan.value = undefined
  selectedMachinery.value = undefined
  checkTimeRange.value = [undefined, undefined]
  visible.value = false
  emit('reset')
}
</script>
