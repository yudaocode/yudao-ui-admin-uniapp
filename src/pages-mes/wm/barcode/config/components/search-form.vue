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
      <yd-search-picker v-model="formData.format" label="条码格式" :dict-type="DICT_TYPE.MES_WM_BARCODE_FORMAT" all-option />
      <yd-search-picker v-model="formData.bizType" label="业务类型" :dict-type="DICT_TYPE.MES_WM_BARCODE_BIZ_TYPE" all-option />
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
  format?: number
  bizType?: number
}

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const formData = reactive<SearchFormData>({
  format: undefined,
  bizType: undefined,
}) // 搜索表单数据

const placeholder = computed(() => { // 搜索条件摘要
  const conditions: string[] = []
  if (formData.format != null && formData.format !== -1) {
    conditions.push(`条码格式:${getDictLabel(DICT_TYPE.MES_WM_BARCODE_FORMAT, formData.format)}`)
  }
  if (formData.bizType != null && formData.bizType !== -1) {
    conditions.push(`业务类型:${getDictLabel(DICT_TYPE.MES_WM_BARCODE_BIZ_TYPE, formData.bizType)}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索条码配置'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    format: formData.format === -1 ? undefined : formData.format,
    bizType: formData.bizType === -1 ? undefined : formData.bizType,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.format = undefined
  formData.bizType = undefined
  visible.value = false
  emit('reset')
}
</script>
