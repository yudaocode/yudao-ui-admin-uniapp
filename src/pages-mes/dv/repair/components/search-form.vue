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
          维修单编号
        </view>
        <wd-input
          v-model="formData.code"
          placeholder="请输入维修单编号"
          clearable
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          维修单名称
        </view>
        <wd-input
          v-model="formData.name"
          placeholder="请输入维修单名称"
          clearable
        />
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
      <yd-search-picker v-model="formData.result" label="维修结果" :dict-type="DICT_TYPE.MES_DV_REPAIR_RESULT" all-option />
      <yd-search-picker v-model="formData.status" label="单据状态" :dict-type="DICT_TYPE.MES_DV_REPAIR_STATUS" all-option />
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

  <MachineryPicker ref="machineryPickerRef" @confirm="handleMachineryConfirm" />
</template>

<script lang="ts" setup>
import type { DvMachinery } from '@/api/mes/dv/machinery'
import { computed, reactive, ref } from 'vue'
import { getDictLabel } from '@/hooks/useDict'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import MachineryPicker from '../../machinery/components/machinery-picker.vue'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const machineryPickerRef = ref<InstanceType<typeof MachineryPicker>>() // 设备选择器
const selectedMachinery = ref<DvMachinery>() // 已选设备
const formData = reactive<Record<string, any>>({
  code: '',
  name: '',
  machineryId: undefined,
  result: -1,
  status: -1,
}) // 搜索表单数据
const selectedMachineryText = computed(() => {
  return selectedMachinery.value
    ? `${selectedMachinery.value.code || '-'} / ${selectedMachinery.value.name || '-'}`
    : ''
})

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.code) {
    conditions.push(`编号:${formData.code}`)
  }
  if (formData.name) {
    conditions.push(`名称:${formData.name}`)
  }
  if (selectedMachinery.value) {
    conditions.push(`设备:${selectedMachinery.value.code || selectedMachinery.value.name}`)
  }
  if (formData.result !== -1) {
    conditions.push(`结果:${getDictLabel(DICT_TYPE.MES_DV_REPAIR_RESULT, formData.result)}`)
  }
  if (formData.status !== -1) {
    conditions.push(`状态:${getDictLabel(DICT_TYPE.MES_DV_REPAIR_STATUS, formData.status)}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索维修工单'
})

/** 打开设备选择器 */
function openMachineryPicker() {
  machineryPickerRef.value?.open()
}

/** 选择设备 */
function handleMachineryConfirm(item: DvMachinery) {
  selectedMachinery.value = item
  formData.machineryId = item.id
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
    code: formData.code || undefined,
    name: formData.name || undefined,
    machineryId: formData.machineryId || undefined,
    result: formData.result === -1 ? undefined : formData.result,
    status: formData.status === -1 ? undefined : formData.status,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.code = ''
  formData.name = ''
  formData.machineryId = undefined
  formData.result = -1
  formData.status = -1
  selectedMachinery.value = undefined
  visible.value = false
  emit('reset')
}
</script>
