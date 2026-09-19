<template>
  <!-- 搜索框入口 -->
  <view @click="visible = true">
    <wd-search placeholder="搜索用车申请" hide-cancel disabled />
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
          申请单号
        </view>
        <wd-input
          v-model="formData.no"
          placeholder="请输入申请单号"
          clearable
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          车牌号
        </view>
        <wd-input
          v-model="formData.vehicleNo"
          placeholder="请输入车牌号"
          clearable
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          审批状态
        </view>
        <yd-search-picker
          v-model="formData.status"
          :columns="statusOptions"
          all-option
          all-label="全部状态"
          placeholder="请选择审批状态"
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          还车状态
        </view>
        <yd-search-picker
          v-model="formData.returnStatus"
          :columns="getIntDictOptions(DICT_TYPE.OA_VEHICLE_RETURN_STATUS)"
          all-option
          all-label="全部还车状态"
          placeholder="请选择还车状态"
        />
      </view>
      <yd-search-date-range v-model="formData.createTime" label="申请时间" />
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          申请部门
        </view>
        <DeptSearchPicker v-model="formData.deptId" placeholder="请选择申请部门" />
      </view>
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
</template>

<script lang="ts" setup>
import { reactive, ref } from 'vue'
import { DeptSearchPicker } from '@/components/system-select'
import { getIntDictOptions } from '@/hooks/useDict'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { OA_APPLY_STATUS } from '../../../utils/constants'
import { formatDateRange } from '@/utils/date'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const statusOptions = [ // 审批状态选项：补「未提交」承接草稿（status=-1），字典仅含审批中及以后
  { label: '未提交', value: OA_APPLY_STATUS.NOT_START },
  ...getIntDictOptions(DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS).filter(item => item.value !== OA_APPLY_STATUS.NOT_START),
]
const visible = ref(false) // 搜索弹窗显示状态
const formData = reactive({
  deptId: undefined as number | undefined,
  no: undefined as string | undefined,
  vehicleNo: undefined as string | undefined,
  status: undefined as number | undefined,
  returnStatus: undefined as number | undefined,
  createTime: [undefined, undefined] as [number | undefined, number | undefined],
}) // 搜索表单数据

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    deptId: formData.deptId,
    no: formData.no || undefined,
    vehicleNo: formData.vehicleNo || undefined,
    status: formData.status,
    returnStatus: formData.returnStatus,
    createTime: formatDateRange(formData.createTime),
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.deptId = undefined
  formData.no = undefined
  formData.vehicleNo = undefined
  formData.status = undefined
  formData.returnStatus = undefined
  formData.createTime = [undefined, undefined]
  visible.value = false
  emit('reset')
}
</script>
