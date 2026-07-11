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
          工作站
        </view>
        <view class="min-h-72rpx flex items-center gap-12rpx rounded-8rpx bg-[#f7f8fa] px-24rpx text-28rpx" @click="openWorkstationPicker">
          <text v-if="selectedWorkstationText" class="min-w-0 flex-1 truncate text-[#333]">
            {{ selectedWorkstationText }}
          </text>
          <text v-else class="min-w-0 flex-1 truncate text-[#999]">
            请选择工作站
          </text>
          <wd-icon
            v-if="selectedWorkstationText"
            name="close-circle"
            size="30rpx"
            custom-style="color: #c0c4cc;"
            @click.stop="clearWorkstation"
          />
        </view>
      </view>
      <UserSearchPicker ref="userPickerRef" v-model="formData.userId" label="发起人" placeholder="请选择发起人" />
      <UserSearchPicker ref="handlerUserSearchPickerRef" v-model="formData.handlerUserId" label="处置人" placeholder="请选择处置人" />
      <yd-search-picker v-model="formData.status" label="处置状态" :dict-type="DICT_TYPE.MES_PRO_ANDON_STATUS" all-option />
      <yd-search-date-range v-model="createTimeRange" label="发起时间" />
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

  <WorkstationPicker ref="workstationPickerRef" @confirm="handleWorkstationConfirm" />
</template>

<script lang="ts" setup>
import type { MdWorkstation } from '@/api/mes/md/workstation'
import { computed, reactive, ref } from 'vue'
import { getDictLabel } from '@/hooks/useDict'
import UserSearchPicker from '@/components/system-select/user-search-picker.vue'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateRange } from '@/utils/date'
import WorkstationPicker from '@/pages-mes/md/workstation/components/workstation-picker.vue'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const createTimeRange = ref<[number | undefined, number | undefined]>() // 发起时间范围
const workstationPickerRef = ref<InstanceType<typeof WorkstationPicker>>() // 工作站选择器
const userPickerRef = ref<InstanceType<typeof UserSearchPicker>>() // 发起人选择器
const handlerUserSearchPickerRef = ref<InstanceType<typeof UserSearchPicker>>() // 处置人选择器
const selectedWorkstation = ref<MdWorkstation>() // 已选工作站
const formData = reactive({
  workstationId: undefined,
  userId: undefined,
  handlerUserId: undefined,
  status: undefined,
}) // 搜索表单数据
const selectedWorkstationText = computed(() => {
  return selectedWorkstation.value
    ? `${selectedWorkstation.value.code || '-'} / ${selectedWorkstation.value.name || '-'}`
    : ''
})

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (selectedWorkstation.value) {
    conditions.push(`工作站:${selectedWorkstation.value.code || selectedWorkstation.value.name}`)
  }
  const userName = userPickerRef.value?.format(formData.userId)
  if (userName) {
    conditions.push(`发起人:${userName}`)
  }
  const handlerName = handlerUserSearchPickerRef.value?.format(formData.handlerUserId)
  if (handlerName) {
    conditions.push(`处置人:${handlerName}`)
  }
  if (formData.status != null) {
    conditions.push(`状态:${getDictLabel(DICT_TYPE.MES_PRO_ANDON_STATUS, formData.status)}`)
  }
  if (createTimeRange.value?.length === 2) {
    conditions.push('发起时间')
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索安灯呼叫记录'
})

/** 打开工作站选择器 */
function openWorkstationPicker() {
  workstationPickerRef.value?.open(formData.workstationId)
}

/** 选择工作站 */
function handleWorkstationConfirm(item: MdWorkstation) {
  selectedWorkstation.value = item
  formData.workstationId = item.id
}

/** 清空工作站 */
function clearWorkstation() {
  selectedWorkstation.value = undefined
  formData.workstationId = undefined
}

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    workstationId: formData.workstationId,
    userId: formData.userId,
    handlerUserId: formData.handlerUserId,
    status: formData.status,
    createTime: formatDateRange(createTimeRange.value),
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.workstationId = undefined
  formData.userId = undefined
  formData.handlerUserId = undefined
  formData.status = undefined
  createTimeRange.value = undefined
  selectedWorkstation.value = undefined
  visible.value = false
  emit('reset')
}
</script>
