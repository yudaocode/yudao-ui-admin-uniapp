<template>
  <view @click="visible = true">
    <wd-search :placeholder="placeholder" hide-cancel disabled />
  </view>
  <wd-popup v-model="visible" position="top" :custom-style="getTopPopupStyle()" :modal-style="getTopPopupModalStyle()" @close="visible = false">
    <view class="yd-search-form-container">
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          类型名称
        </view>
        <wd-input v-model="formData.name" placeholder="请输入类型名称" clearable />
      </view>
      <yd-search-picker v-model="formData.status" label="状态" :dict-type="DICT_TYPE.COMMON_STATUS" all-option />
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
import { getDictLabel } from '@/hooks/useDict'
import { DICT_TYPE } from '@/utils/constants'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'

const emit = defineEmits<{ search: [data: Record<string, any>], reset: [] }>()
const visible = ref(false) // 搜索弹窗显示状态
const formData = reactive<Record<string, any>>({
  name: undefined,
  status: -1, // -1 表示全部
}) // 搜索表单数据

const placeholder = computed(() => { // 搜索条件展示文案
  const conditions: string[] = []
  if (formData.name) {
    conditions.push(`名称:${formData.name}`)
  }
  if (formData.status !== -1) {
    conditions.push(`状态:${getDictLabel(DICT_TYPE.COMMON_STATUS, formData.status)}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索设备类型'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    name: formData.name || undefined,
    status: formData.status === -1 ? undefined : formData.status,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.name = undefined
  formData.status = -1
  visible.value = false
  emit('reset')
}
</script>
