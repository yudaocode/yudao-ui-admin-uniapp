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
          任务标题
        </view>
        <wd-input
          v-model="formData.title"
          placeholder="请输入任务标题"
          clearable
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          任务类型
        </view>
        <yd-search-picker
          v-model="formData.type"
          :columns="getIntDictOptions(DICT_TYPE.OA_TASK_TYPE)"
          all-option
          all-label="全部类型"
          placeholder="请选择任务类型"
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          任务状态
        </view>
        <yd-search-picker
          v-model="formData.status"
          :columns="getIntDictOptions(DICT_TYPE.OA_TASK_STATUS)"
          all-option
          all-label="全部状态"
          placeholder="请选择任务状态"
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          取消状态
        </view>
        <yd-search-picker
          v-model="formData.canceled"
          :columns="canceledOptions"
          all-option
          all-label="全部"
          placeholder="请选择取消状态"
        />
      </view>
      <view v-if="showPublisher" class="yd-search-form-item">
        <view class="yd-search-form-label">
          发布人
        </view>
        <UserSearchPicker
          v-model="formData.publisherUserId"
          placeholder="请选择发布人"
          @change="publisherName = $event?.nickname"
        />
      </view>
      <yd-search-date-range v-model="formData.publishTime" label="发布时间" />
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
import { UserSearchPicker } from '@/components/system-select'
import { getDictLabel, getIntDictOptions } from '@/hooks/useDict'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate, formatDateRange } from '@/utils/date'

const props = withDefaults(defineProps<{
  showPublisher?: boolean // 是否展示发布人筛选，仅「我的任务」页使用
}>(), {
  showPublisher: false,
})

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const canceledOptions = [ // 取消状态选项，1 表示已取消，提交时转为布尔值
  { label: '正常', value: 0 },
  { label: '已取消', value: 1 },
]
const visible = ref(false) // 搜索弹窗显示状态
const publisherName = ref<string>() // 已选发布人姓名，用于折叠摘要回显
const formData = reactive({
  title: undefined as string | undefined,
  type: undefined as number | undefined,
  status: undefined as number | undefined,
  canceled: undefined as number | undefined,
  publisherUserId: undefined as number | undefined,
  publishTime: [undefined, undefined] as [number | undefined, number | undefined],
}) // 搜索表单数据

const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.title) {
    conditions.push(`标题:${formData.title}`)
  }
  if (formData.type !== undefined) {
    conditions.push(`类型:${getDictLabel(DICT_TYPE.OA_TASK_TYPE, formData.type)}`)
  }
  if (formData.status !== undefined) {
    conditions.push(`状态:${getDictLabel(DICT_TYPE.OA_TASK_STATUS, formData.status)}`)
  }
  if (formData.canceled !== undefined) {
    conditions.push(`取消:${formData.canceled === 1 ? '已取消' : '正常'}`)
  }
  if (props.showPublisher && formData.publisherUserId !== undefined) {
    conditions.push(`发布人:${publisherName.value || formData.publisherUserId}`)
  }
  if (formData.publishTime?.[0] && formData.publishTime?.[1]) {
    conditions.push(`发布:${formatDate(formData.publishTime[0])}~${formatDate(formData.publishTime[1])}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索任务'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    title: formData.title || undefined,
    type: formData.type,
    status: formData.status,
    canceled: formData.canceled === undefined ? undefined : formData.canceled === 1,
    publisherUserId: props.showPublisher ? formData.publisherUserId : undefined,
    publishTime: formatDateRange(formData.publishTime),
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.title = undefined
  formData.type = undefined
  formData.status = undefined
  formData.canceled = undefined
  formData.publisherUserId = undefined
  publisherName.value = undefined
  formData.publishTime = [undefined, undefined]
  visible.value = false
  emit('reset')
}
</script>
