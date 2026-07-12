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
          名称
        </view>
        <wd-input v-model="formData.name" placeholder="请输入名称" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          模型标识
        </view>
        <wd-input v-model="formData.model" placeholder="请输入模型标识" clearable />
      </view>
      <yd-search-picker v-model="formData.platform" label="平台" :dict-type="DICT_TYPE.AI_PLATFORM" dict-kind="str" all-option />
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
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const formData = reactive({
  name: undefined as string | undefined,
  model: undefined as string | undefined,
  platform: undefined as string | undefined,
}) // 搜索表单数据

const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.name) {
    conditions.push(`名称:${formData.name}`)
  }
  if (formData.model) {
    conditions.push(`标识:${formData.model}`)
  }
  if (formData.platform) {
    conditions.push(`平台:${getDictLabel(DICT_TYPE.AI_PLATFORM, formData.platform)}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索模型'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    name: formData.name || undefined,
    model: formData.model || undefined,
    platform: formData.platform,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.name = undefined
  formData.model = undefined
  formData.platform = undefined
  visible.value = false
  emit('reset')
}
</script>
