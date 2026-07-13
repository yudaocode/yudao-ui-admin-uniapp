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
          表情名
        </view>
        <wd-input v-model="formData.name" placeholder="请输入表情名" clearable />
      </view>
      <yd-search-date-range v-model="formData.createTime" label="添加时间" />
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
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { formatDate, formatDateRange } from '@/utils/date'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const userPickerRef = ref<any>() // 用户选择器引用
const formData = reactive({
  userId: undefined as number | undefined,
  name: undefined as string | undefined,
  createTime: [undefined, undefined] as [number | undefined, number | undefined],
}) // 搜索表单数据

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.userId) {
    conditions.push(`用户:${userPickerRef.value?.format(formData.userId) || formData.userId}`)
  }
  if (formData.name) {
    conditions.push(`表情名:${formData.name}`)
  }
  if (formData.createTime?.[0] && formData.createTime?.[1]) {
    conditions.push(`添加时间:${formatDate(formData.createTime[0])}~${formatDate(formData.createTime[1])}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索用户表情'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    userId: formData.userId,
    name: formData.name || undefined,
    createTime: formatDateRange(formData.createTime),
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.userId = undefined
  formData.name = undefined
  formData.createTime = [undefined, undefined]
  visible.value = false
  emit('reset')
}
</script>
