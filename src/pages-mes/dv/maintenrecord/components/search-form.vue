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
          保养计划
        </view>
        <view class="min-h-72rpx flex items-center gap-12rpx rounded-8rpx bg-[#f7f8fa] px-24rpx text-28rpx" @click="openPlanPicker">
          <text v-if="selectedPlanText" class="min-w-0 flex-1 truncate text-[#333]">
            {{ selectedPlanText }}
          </text>
          <text v-else class="min-w-0 flex-1 truncate text-[#999]">
            请选择保养计划
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
      <UserSearchPicker ref="userPickerRef" v-model="formData.userId" label="保养人" placeholder="请选择保养人" />
      <yd-search-date-range v-model="maintenTimeRange" label="保养时间" />
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

  <CheckPlanPicker
    ref="planPickerRef"
    title="选择保养计划"
    :type="MesDvSubjectTypeEnum.MAINTENANCE"
    @confirm="handlePlanConfirm"
  />
  <MachineryPicker ref="machineryPickerRef" @confirm="handleMachineryConfirm" />
</template>

<script lang="ts" setup>
import type { DvCheckPlan } from '@/api/mes/dv/checkplan'
import type { DvMachinery } from '@/api/mes/dv/machinery'
import { computed, reactive, ref } from 'vue'
import UserSearchPicker from '@/components/system-select/user-search-picker.vue'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { MesDvSubjectTypeEnum } from '@/utils/constants'
import { formatDateRange } from '@/utils/date'
import CheckPlanPicker from '../../checkplan/components/check-plan-picker.vue'
import MachineryPicker from '../../machinery/components/machinery-picker.vue'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const planPickerRef = ref<InstanceType<typeof CheckPlanPicker>>() // 保养计划选择器
const machineryPickerRef = ref<InstanceType<typeof MachineryPicker>>() // 设备选择器
const userPickerRef = ref<InstanceType<typeof UserSearchPicker>>() // 保养人选择器
const selectedPlan = ref<DvCheckPlan>() // 已选计划
const selectedMachinery = ref<DvMachinery>() // 已选设备
const maintenTimeRange = ref<[number | undefined, number | undefined]>([undefined, undefined]) // 保养时间范围
const formData = reactive<Record<string, any>>({
  planId: undefined,
  machineryId: undefined,
  userId: undefined,
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
    conditions.push(`计划:${selectedPlan.value.code || selectedPlan.value.name}`)
  }
  if (selectedMachinery.value) {
    conditions.push(`设备:${selectedMachinery.value.code || selectedMachinery.value.name}`)
  }
  const userName = userPickerRef.value?.format(formData.userId)
  if (userName) {
    conditions.push(`保养人:${userName}`)
  }
  if (formatDateRange(maintenTimeRange.value)) {
    conditions.push('保养时间')
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索保养记录'
})

/** 打开计划选择器 */
function openPlanPicker() {
  planPickerRef.value?.open()
}

/** 打开设备选择器 */
function openMachineryPicker() {
  machineryPickerRef.value?.open()
}

/** 选择计划 */
function handlePlanConfirm(item: DvCheckPlan) {
  selectedPlan.value = item
  formData.planId = item.id
}

/** 选择设备 */
function handleMachineryConfirm(item: DvMachinery) {
  selectedMachinery.value = item
  formData.machineryId = item.id
}

/** 清空计划 */
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
    maintenTime: formatDateRange(maintenTimeRange.value),
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.planId = undefined
  formData.machineryId = undefined
  formData.userId = undefined
  selectedPlan.value = undefined
  selectedMachinery.value = undefined
  maintenTimeRange.value = [undefined, undefined]
  visible.value = false
  emit('reset')
}
</script>
