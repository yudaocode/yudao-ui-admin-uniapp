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
          音乐标题
        </view>
        <wd-input
          v-model="formData.title"
          placeholder="请输入音乐标题"
          clearable
        />
      </view>
      <UserSearchPicker ref="userPickerRef" v-model="formData.userId" label="用户" placeholder="请选择用户" />
      <yd-search-picker v-model="formData.status" label="音乐状态" :dict-type="DICT_TYPE.AI_MUSIC_STATUS" all-option />
      <yd-search-picker v-model="formData.generateMode" label="生成模式" :dict-type="DICT_TYPE.AI_GENERATE_MODE" all-option />
      <yd-search-picker v-model="formData.publicStatus" label="是否发布" :columns="publicStatusOptions" all-option />
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
import { getDictLabel } from '@/hooks/useDict'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate, formatDateRange } from '@/utils/date'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const userPickerRef = ref<InstanceType<typeof UserSearchPicker>>() // 用户选择器引用
const formData = reactive({
  title: undefined as string | undefined,
  userId: undefined as number | undefined,
  status: undefined as number | undefined,
  generateMode: undefined as number | undefined,
  publicStatus: undefined as boolean | undefined,
  createTime: [undefined, undefined] as [number | undefined, number | undefined],
}) // 搜索表单数据
const publicStatusOptions = [ // 是否发布选项
  { label: '已发布', value: true },
  { label: '未发布', value: false },
]
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.title) {
    conditions.push(`标题:${formData.title}`)
  }
  if (formData.userId) {
    conditions.push(`用户:${userPickerRef.value?.format(formData.userId) || formData.userId}`)
  }
  if (formData.status !== undefined) {
    conditions.push(`状态:${getDictLabel(DICT_TYPE.AI_MUSIC_STATUS, formData.status)}`)
  }
  if (formData.generateMode !== undefined) {
    conditions.push(`模式:${getDictLabel(DICT_TYPE.AI_GENERATE_MODE, formData.generateMode)}`)
  }
  if (formData.publicStatus !== undefined) {
    conditions.push(`发布:${formData.publicStatus ? '是' : '否'}`)
  }
  if (formData.createTime[0] && formData.createTime[1]) {
    conditions.push(`时间:${formatDate(formData.createTime[0])}~${formatDate(formData.createTime[1])}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索音乐记录'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    title: formData.title || undefined,
    userId: formData.userId,
    status: formData.status,
    generateMode: formData.generateMode,
    publicStatus: formData.publicStatus,
    createTime: formatDateRange(formData.createTime),
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.title = undefined
  formData.userId = undefined
  formData.status = undefined
  formData.generateMode = undefined
  formData.publicStatus = undefined
  formData.createTime = [undefined, undefined]
  visible.value = false
  emit('reset')
}
</script>
