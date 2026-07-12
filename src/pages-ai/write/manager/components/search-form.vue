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
          模型平台
        </view>
        <wd-input
          v-model="formData.platform"
          placeholder="请输入模型平台"
          clearable
        />
      </view>
      <UserSearchPicker ref="userPickerRef" v-model="formData.userId" label="用户" placeholder="请选择用户" />
      <yd-search-picker v-model="formData.type" label="写作类型" :dict-type="DICT_TYPE.AI_WRITE_TYPE" all-option />
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
  platform: undefined as string | undefined,
  userId: undefined as number | undefined,
  type: undefined as number | undefined,
  createTime: [undefined, undefined] as [number | undefined, number | undefined],
}) // 搜索表单数据
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.platform) {
    conditions.push(`平台:${formData.platform}`)
  }
  if (formData.userId) {
    conditions.push(`用户:${userPickerRef.value?.format(formData.userId) || formData.userId}`)
  }
  if (formData.type !== undefined) {
    conditions.push(`类型:${getDictLabel(DICT_TYPE.AI_WRITE_TYPE, formData.type)}`)
  }
  if (formData.createTime[0] && formData.createTime[1]) {
    conditions.push(`时间:${formatDate(formData.createTime[0])}~${formatDate(formData.createTime[1])}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索写作记录'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    platform: formData.platform || undefined,
    userId: formData.userId,
    type: formData.type,
    createTime: formatDateRange(formData.createTime),
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.platform = undefined
  formData.userId = undefined
  formData.type = undefined
  formData.createTime = [undefined, undefined]
  visible.value = false
  emit('reset')
}
</script>
