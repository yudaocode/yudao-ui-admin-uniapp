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
      <UserSearchPicker ref="userPickerRef" v-model="formData.userId" label="用户" placeholder="请选择用户" />
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          项目名称
        </view>
        <wd-input v-model="formData.name" placeholder="请输入项目名称" clearable />
      </view>
      <yd-search-picker v-model="formData.status" label="项目状态" :dict-type="DICT_TYPE.AI_DRAMA_PROJECT_STATUS" all-option />
      <yd-search-picker v-model="formData.composeStatus" label="成片状态" :dict-type="DICT_TYPE.AI_DRAMA_STATUS" all-option />
      <yd-search-picker v-model="formData.publicStatus" label="是否公开" :columns="publicStatusOptions" all-option />
      <yd-search-picker v-model="formData.aspectRatio" label="画幅" :columns="AI_DRAMA_ASPECT_RATIOS" all-option />
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
import { computed, reactive, ref } from 'vue'
import UserSearchPicker from '@/components/system-select/user-search-picker.vue'
import { getBoolDictOptions, getDictLabel } from '@/hooks/useDict'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { AI_DRAMA_ASPECT_RATIOS, DICT_TYPE } from '@/utils/constants'
import { formatDate, formatDateRange } from '@/utils/date'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const userPickerRef = ref<InstanceType<typeof UserSearchPicker>>() // 用户选择器引用
const formData = reactive({ // 搜索表单数据
  userId: undefined as number | undefined,
  name: undefined as string | undefined,
  status: undefined as number | undefined,
  composeStatus: undefined as number | undefined,
  publicStatus: undefined as boolean | undefined,
  aspectRatio: undefined as string | undefined,
  createTime: [undefined, undefined] as [number | undefined, number | undefined],
})
const publicStatusOptions = getBoolDictOptions(DICT_TYPE.INFRA_BOOLEAN_STRING) // 是否公开选项
const placeholder = computed(() => { // 搜索条件摘要
  const conditions: string[] = []
  if (formData.userId) {
    conditions.push(`用户:${userPickerRef.value?.format(formData.userId) || formData.userId}`)
  }
  if (formData.name) {
    conditions.push(`名称:${formData.name}`)
  }
  if (formData.status !== undefined) {
    conditions.push(`项目:${getDictLabel(DICT_TYPE.AI_DRAMA_PROJECT_STATUS, formData.status)}`)
  }
  if (formData.composeStatus !== undefined) {
    conditions.push(`成片:${getDictLabel(DICT_TYPE.AI_DRAMA_STATUS, formData.composeStatus)}`)
  }
  if (formData.publicStatus !== undefined) {
    conditions.push(`公开:${getDictLabel(DICT_TYPE.INFRA_BOOLEAN_STRING, formData.publicStatus)}`)
  }
  if (formData.aspectRatio) {
    conditions.push(`画幅:${formData.aspectRatio}`)
  }
  if (formData.createTime[0] && formData.createTime[1]) {
    conditions.push(`时间:${formatDate(formData.createTime[0])}~${formatDate(formData.createTime[1])}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索短剧项目'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    userId: formData.userId,
    name: formData.name || undefined,
    status: formData.status,
    composeStatus: formData.composeStatus,
    publicStatus: formData.publicStatus,
    aspectRatio: formData.aspectRatio,
    createTime: formatDateRange(formData.createTime),
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.userId = undefined
  formData.name = undefined
  formData.status = undefined
  formData.composeStatus = undefined
  formData.publicStatus = undefined
  formData.aspectRatio = undefined
  formData.createTime = [undefined, undefined]
  visible.value = false
  emit('reset')
}
</script>
