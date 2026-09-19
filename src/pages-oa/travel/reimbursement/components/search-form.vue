<template>
  <!-- 搜索框入口 -->
  <view @click="visible = true">
    <wd-search placeholder="搜索差旅报销" hide-cancel disabled />
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
          单据编号
        </view>
        <wd-input
          v-model="formData.no"
          placeholder="请输入单据编号"
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
          支付状态
        </view>
        <yd-search-picker
          v-model="formData.payStatus"
          :columns="payStatusOptions"
          all-option
          all-label="全部支付状态"
          placeholder="请选择支付状态"
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          申请部门
        </view>
        <DeptSearchPicker v-model="formData.deptId" placeholder="请选择申请部门" />
      </view>
      <yd-search-date-range v-model="formData.createTime" label="创建时间" />
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
const payStatusOptions = [ // 支付状态选项：true 已支付 false 未支付
  { label: '已支付', value: true },
  { label: '未支付', value: false },
]
const formData = reactive({
  no: undefined as string | undefined,
  status: undefined as number | undefined,
  payStatus: undefined as boolean | undefined,
  deptId: undefined as number | undefined,
  createTime: [undefined, undefined] as [number | undefined, number | undefined],
}) // 搜索表单数据

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    no: formData.no || undefined,
    status: formData.status,
    payStatus: formData.payStatus,
    deptId: formData.deptId,
    createTime: formatDateRange(formData.createTime),
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.no = undefined
  formData.status = undefined
  formData.payStatus = undefined
  formData.deptId = undefined
  formData.createTime = [undefined, undefined]
  visible.value = false
  emit('reset')
}
</script>
