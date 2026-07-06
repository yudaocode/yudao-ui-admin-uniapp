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
          报工单号
        </view>
        <wd-input v-model="formData.code" placeholder="请输入报工单号" clearable />
      </view>
      <yd-search-picker v-model="formData.type" label="报工类型" :dict-type="DICT_TYPE.MES_PRO_FEEDBACK_TYPE" all-option />
      <WorkOrderSearchPicker ref="workOrderSearchPickerRef" v-model="formData.workOrderId" label="生产工单" placeholder="请选择工单" />
      <ItemSearchPicker ref="itemSearchPickerRef" v-model="formData.itemId" label="产品物料" placeholder="请选择产品物料" item-or-product="PRODUCT" title="选择产品物料" />
      <UserPicker
        ref="feedbackUserPickerRef"
        v-model="formData.feedbackUserId"
        label="报工人"
        label-width="180rpx"
        type="radio"
        placeholder="请选择报工人"
      />
      <UserPicker
        ref="creatorPickerRef"
        v-model="formData.creator"
        label="记录人"
        label-width="180rpx"
        type="radio"
        placeholder="请选择记录人"
      />
      <yd-search-picker v-model="formData.status" label="状态" :dict-type="DICT_TYPE.MES_PRO_FEEDBACK_STATUS" all-option />
      <yd-search-date-range v-model="formData.feedbackTime" label="报工时间" />
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
import UserPicker from '@/components/system-select/user-picker.vue'
import { getDictLabel } from '@/hooks/useDict'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateRange } from '@/utils/date'
import ItemSearchPicker from '@/pages-mes/md/item/components/item-search-picker.vue'
import WorkOrderSearchPicker from '@/pages-mes/pro/workorder/components/workorder-search-picker.vue'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

type DateRangeValue = [number | undefined, number | undefined]
const defaultFeedbackTime: DateRangeValue = [undefined, undefined]

const visible = ref(false) // 搜索弹窗显示状态
const formData = reactive<Record<string, any>>({
  code: undefined,
  type: undefined,
  workOrderId: undefined,
  itemId: undefined,
  feedbackUserId: undefined,
  creator: undefined,
  status: undefined,
  feedbackTime: defaultFeedbackTime,
}) // 搜索表单数据
const workOrderSearchPickerRef = ref<InstanceType<typeof WorkOrderSearchPicker>>() // 工单搜索选择器
const itemSearchPickerRef = ref<InstanceType<typeof ItemSearchPicker>>() // 物料搜索选择器
const feedbackUserPickerRef = ref<InstanceType<typeof UserPicker>>() // 报工人选择器引用
const creatorPickerRef = ref<InstanceType<typeof UserPicker>>() // 记录人选择器引用

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.code) {
    conditions.push(`单号:${formData.code}`)
  }
  if (formData.type != null && formData.type !== -1) {
    conditions.push(`类型:${getDictLabel(DICT_TYPE.MES_PRO_FEEDBACK_TYPE, formData.type) || formData.type}`)
  }
  if (formData.workOrderId) {
    conditions.push(`工单:${workOrderSearchPickerRef.value?.format(formData.workOrderId) || formData.workOrderId}`)
  }
  if (formData.itemId) {
    conditions.push(`物料:${itemSearchPickerRef.value?.format(formData.itemId) || formData.itemId}`)
  }
  if (formData.feedbackUserId) {
    const nickname = feedbackUserPickerRef.value?.getUserNickname(formData.feedbackUserId)
    conditions.push(`报工人:${nickname || formData.feedbackUserId}`)
  }
  if (formData.creator) {
    const nickname = creatorPickerRef.value?.getUserNickname(formData.creator)
    conditions.push(`记录人:${nickname || formData.creator}`)
  }
  if (formData.status != null && formData.status !== -1) {
    conditions.push(`状态:${getDictLabel(DICT_TYPE.MES_PRO_FEEDBACK_STATUS, formData.status) || formData.status}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索生产报工'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    ...formData,
    type: formData.type === -1 ? undefined : formData.type,
    status: formData.status === -1 ? undefined : formData.status,
    feedbackTime: formatDateRange(formData.feedbackTime),
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.code = undefined
  formData.type = undefined
  formData.workOrderId = undefined
  formData.itemId = undefined
  formData.feedbackUserId = undefined
  formData.creator = undefined
  formData.status = undefined
  formData.feedbackTime = [undefined, undefined]
  visible.value = false
  emit('reset')
}
</script>
