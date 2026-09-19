<template>
  <!-- 搜索框入口 -->
  <view @click="visible = true">
    <wd-search placeholder="搜索会议室预定" hide-cancel disabled />
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
          会议主题
        </view>
        <wd-input
          v-model="formData.title"
          placeholder="请输入会议主题"
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
          使用状态
        </view>
        <yd-search-picker
          v-model="formData.useStatus"
          :columns="getIntDictOptions(DICT_TYPE.OA_MEETING_ROOM_USE_STATUS)"
          all-option
          all-label="全部使用状态"
          placeholder="请选择使用状态"
        />
      </view>
      <yd-search-date-range v-model="formData.createTime" label="申请时间" />
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          单号
        </view>
        <wd-input
          v-model="formData.no"
          placeholder="请输入单号"
          clearable
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          会议室名称
        </view>
        <wd-input
          v-model="formData.roomName"
          placeholder="请输入会议室名称"
          clearable
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          主持人
        </view>
        <wd-input
          v-model="formData.moderatorName"
          placeholder="请输入主持人"
          clearable
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          申请部门
        </view>
        <DeptSearchPicker v-model="formData.deptId" placeholder="请选择申请部门" />
      </view>
      <yd-search-date-range v-model="formData.startTime" label="开始时间" />
      <yd-search-date-range v-model="formData.endTime" label="结束时间" />
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          创建人
        </view>
        <UserSearchPicker v-model="formData.creator" placeholder="请选择创建人" />
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
import { DeptSearchPicker, UserSearchPicker } from '@/components/system-select'
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
  no: undefined as string | undefined,
  roomName: undefined as string | undefined,
  moderatorName: undefined as string | undefined,
  deptId: undefined as number | undefined,
  startTime: [undefined, undefined] as [number | undefined, number | undefined],
  endTime: [undefined, undefined] as [number | undefined, number | undefined],
  creator: undefined as number | undefined, // 创建人编号，后端按字符串接收
  title: undefined as string | undefined,
  status: undefined as number | undefined,
  useStatus: undefined as number | undefined,
  createTime: [undefined, undefined] as [number | undefined, number | undefined],
}) // 搜索表单数据

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    no: formData.no || undefined,
    roomName: formData.roomName || undefined,
    moderatorName: formData.moderatorName || undefined,
    deptId: formData.deptId,
    startTime: formatDateRange(formData.startTime),
    endTime: formatDateRange(formData.endTime),
    creator: formData.creator == null ? undefined : String(formData.creator),
    title: formData.title || undefined,
    status: formData.status,
    useStatus: formData.useStatus,
    createTime: formatDateRange(formData.createTime),
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.no = undefined
  formData.roomName = undefined
  formData.moderatorName = undefined
  formData.deptId = undefined
  formData.startTime = [undefined, undefined]
  formData.endTime = [undefined, undefined]
  formData.creator = undefined
  formData.title = undefined
  formData.status = undefined
  formData.useStatus = undefined
  formData.createTime = [undefined, undefined]
  visible.value = false
  emit('reset')
}
</script>
