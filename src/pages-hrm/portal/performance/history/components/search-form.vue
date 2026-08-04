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
          考核名称
        </view>
        <wd-input
          v-model="formData.search"
          clearable
          placeholder="请输入考核名称"
        />
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

const visible = ref(false) // 搜索弹窗显示状态
const formData = reactive({
  search: undefined as string | undefined,
}) // 搜索表单数据

const placeholder = computed(() => {
  return formData.search?.trim() ? `考核名称:${formData.search.trim()}` : '搜索我的绩效档案'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    search: formData.search?.trim() || undefined,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.search = undefined
  visible.value = false
  emit('reset')
}
</script>
