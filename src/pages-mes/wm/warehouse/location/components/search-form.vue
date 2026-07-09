<template>
  <view @click="visible = true">
    <wd-search :placeholder="placeholder" hide-cancel disabled />
  </view>
  <wd-popup v-model="visible" position="top" :custom-style="getTopPopupStyle()" :modal-style="getTopPopupModalStyle()" @close="visible = false">
    <view class="yd-search-form-container">
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          库区编码
        </view>
        <wd-input v-model="formData.code" placeholder="请输入库区编码" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          库区名称
        </view>
        <wd-input v-model="formData.name" placeholder="请输入库区名称" clearable />
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
import { computed, reactive, ref } from 'vue'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()
const visible = ref(false) // 搜索弹窗显隐
const formData = reactive({ code: '', name: '' }) // 搜索表单
const placeholder = computed(() => { // 搜索占位文案
  const conditions: string[] = []
  if (formData.code) {
    conditions.push(`编码:${formData.code}`)
  }
  if (formData.name) {
    conditions.push(`名称:${formData.name}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索库区'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    code: formData.code || undefined,
    name: formData.name || undefined,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.code = ''
  formData.name = ''
  visible.value = false
  emit('reset')
}
</script>
