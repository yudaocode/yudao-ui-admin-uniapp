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
      <yd-search-picker v-model="formData.bizType" label="业务类型" :dict-type="DICT_TYPE.MES_WM_BARCODE_BIZ_TYPE" all-option />
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          业务编码
        </view>
        <wd-input
          v-model="formData.bizCode"
          placeholder="请输入业务编码"
          clearable
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          业务名称
        </view>
        <wd-input
          v-model="formData.bizName"
          placeholder="请输入业务名称"
          clearable
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          条码内容
        </view>
        <wd-input
          v-model="formData.content"
          placeholder="请输入条码内容"
          clearable
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
import { getDictLabel } from '@/hooks/useDict'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'

interface SearchFormData {
  bizType?: number
  bizCode?: string
  bizName?: string
  content?: string
}

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const formData = reactive<SearchFormData>({
  bizType: undefined,
  bizCode: undefined,
  bizName: undefined,
  content: undefined,
}) // 搜索表单数据

const placeholder = computed(() => { // 搜索条件摘要
  const conditions: string[] = []
  if (formData.bizType != null && formData.bizType !== -1) {
    conditions.push(`业务类型:${getDictLabel(DICT_TYPE.MES_WM_BARCODE_BIZ_TYPE, formData.bizType)}`)
  }
  if (formData.bizCode) {
    conditions.push(`业务编码:${formData.bizCode}`)
  }
  if (formData.bizName) {
    conditions.push(`业务名称:${formData.bizName}`)
  }
  if (formData.content) {
    conditions.push(`条码内容:${formData.content}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索条码'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    bizType: formData.bizType === -1 ? undefined : formData.bizType,
    bizCode: formData.bizCode || undefined,
    bizName: formData.bizName || undefined,
    content: formData.content || undefined,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.bizType = undefined
  formData.bizCode = undefined
  formData.bizName = undefined
  formData.content = undefined
  visible.value = false
  emit('reset')
}
</script>
