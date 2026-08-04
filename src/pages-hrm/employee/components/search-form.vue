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
          员工姓名
        </view>
        <wd-input v-model="formData.name" placeholder="请输入员工姓名" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          手机号
        </view>
        <wd-input v-model="formData.mobile" placeholder="请输入手机号" clearable />
      </view>
      <yd-search-picker
        v-model="formData.sex"
        label="性别"
        :dict-type="DICT_TYPE.SYSTEM_USER_SEX"
        all-option
      />
      <yd-search-date-range
        v-model="formData.entryTime"
        label="入职时间"
      />
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          工号
        </view>
        <wd-input v-model="formData.jobNumber" placeholder="请输入工号" clearable />
      </view>
      <DeptSearchPicker v-model="formData.deptId" label="部门" />
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          岗位
        </view>
        <wd-input v-model="formData.postName" placeholder="请输入岗位" clearable />
      </view>
      <yd-search-date-range
        v-model="formData.regularTime"
        label="转正时间"
      />
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          工作地点
        </view>
        <wd-input v-model="formData.workAddress" placeholder="请输入工作地点" clearable />
      </view>
      <ChannelSearchPicker v-model="formData.channelId" />
      <yd-search-picker
        v-model="formData.type"
        label="聘用形式"
        :dict-type="DICT_TYPE.HRM_EMPLOYEE_TYPE"
        all-option
      />
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
import { computed, reactive, ref } from 'vue'
import DeptSearchPicker from '@/components/system-select/dept-search-picker.vue'
import ChannelSearchPicker from '@/pages-hrm/recruit/channel/components/channel-search-picker.vue'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateRange } from '@/utils/date'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const formData = reactive({
  name: undefined as string | undefined,
  mobile: undefined as string | undefined,
  sex: undefined as number | undefined,
  entryTime: [undefined, undefined] as [number | undefined, number | undefined],
  jobNumber: undefined as string | undefined,
  deptId: undefined as number | undefined,
  postName: undefined as string | undefined,
  regularTime: [undefined, undefined] as [number | undefined, number | undefined],
  workAddress: undefined as string | undefined,
  channelId: undefined as number | undefined,
  type: undefined as number | undefined,
}) // 搜索表单数据

const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.name) {
    conditions.push(`姓名:${formData.name}`)
  }
  if (formData.mobile) {
    conditions.push(`手机:${formData.mobile}`)
  }
  if (formData.jobNumber) {
    conditions.push(`工号:${formData.jobNumber}`)
  }
  if (formData.postName) {
    conditions.push(`岗位:${formData.postName}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索员工'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    name: formData.name || undefined,
    mobile: formData.mobile || undefined,
    sex: formData.sex,
    entryTime: formatDateRange(formData.entryTime),
    jobNumber: formData.jobNumber || undefined,
    deptId: formData.deptId,
    postName: formData.postName || undefined,
    regularTime: formatDateRange(formData.regularTime),
    workAddress: formData.workAddress || undefined,
    channelId: formData.channelId,
    type: formData.type,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.name = undefined
  formData.mobile = undefined
  formData.sex = undefined
  formData.entryTime = [undefined, undefined]
  formData.jobNumber = undefined
  formData.deptId = undefined
  formData.postName = undefined
  formData.regularTime = [undefined, undefined]
  formData.workAddress = undefined
  formData.channelId = undefined
  formData.type = undefined
  visible.value = false
  emit('reset')
}
</script>
