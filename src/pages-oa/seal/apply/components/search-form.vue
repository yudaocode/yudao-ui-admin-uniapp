<template>
  <!-- 搜索框入口 -->
  <view @click="visible = true">
    <wd-search placeholder="搜索用印申请" hide-cancel disabled />
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
          印章名称
        </view>
        <wd-input
          v-model="formData.sealName"
          placeholder="请输入印章名称"
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
          用印状态
        </view>
        <yd-search-picker
          v-model="formData.useStatus"
          :columns="getIntDictOptions(DICT_TYPE.OA_SEAL_USE_STATUS)"
          all-option
          all-label="全部用印状态"
          placeholder="请选择用印状态"
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          用印类型
        </view>
        <yd-search-picker
          v-model="formData.type"
          :columns="getIntDictOptions(DICT_TYPE.OA_SEAL_APPLY_TYPE)"
          all-option
          all-label="全部类型"
          placeholder="请选择用印类型"
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          用印方式
        </view>
        <yd-search-picker
          v-model="formData.mode"
          :columns="getIntDictOptions(DICT_TYPE.OA_SEAL_USE_MODE)"
          all-option
          all-label="全部方式"
          placeholder="请选择用印方式"
        />
      </view>
      <yd-search-date-range v-model="formData.expectedUseTime" label="预计用印时间" />
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          申请部门
        </view>
        <DeptSearchPicker v-model="formData.deptId" placeholder="请选择申请部门" />
      </view>
      <yd-search-date-range v-model="formData.createTime" label="创建时间" />
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          是否紧急
        </view>
        <yd-search-picker
          v-model="formData.urgent"
          :columns="urgentOptions"
          all-option
          all-label="全部"
          placeholder="请选择是否紧急"
        />
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
const urgentOptions = [ // 是否紧急选项
  { label: '是', value: 1 },
  { label: '否', value: 0 },
]
const visible = ref(false) // 搜索弹窗显示状态
const formData = reactive({
  urgent: undefined as number | undefined, // 是否紧急：1 是 0 否，提交时转布尔
  no: undefined as string | undefined,
  sealName: undefined as string | undefined,
  status: undefined as number | undefined,
  useStatus: undefined as number | undefined,
  type: undefined as number | undefined,
  mode: undefined as number | undefined,
  deptId: undefined as number | undefined,
  expectedUseTime: [undefined, undefined] as [number | undefined, number | undefined],
  createTime: [undefined, undefined] as [number | undefined, number | undefined],
}) // 搜索表单数据

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    urgent: formData.urgent == null ? undefined : formData.urgent === 1,
    no: formData.no || undefined,
    sealName: formData.sealName || undefined,
    status: formData.status,
    useStatus: formData.useStatus,
    type: formData.type,
    mode: formData.mode,
    deptId: formData.deptId,
    expectedUseTime: formatDateRange(formData.expectedUseTime),
    createTime: formatDateRange(formData.createTime),
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.urgent = undefined
  formData.no = undefined
  formData.sealName = undefined
  formData.status = undefined
  formData.useStatus = undefined
  formData.type = undefined
  formData.mode = undefined
  formData.deptId = undefined
  formData.expectedUseTime = [undefined, undefined]
  formData.createTime = [undefined, undefined]
  visible.value = false
  emit('reset')
}
</script>
