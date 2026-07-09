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
          方案编码
        </view>
        <wd-input v-model="formData.code" placeholder="请输入方案编码" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          方案名称
        </view>
        <wd-input v-model="formData.name" placeholder="请输入方案名称" clearable />
      </view>
      <yd-search-picker v-model="formData.type" label="盘点类型" :columns="stockTakingTypeOptions" all-option />
      <yd-search-picker v-model="formData.status" label="状态" :columns="statusOptions" all-option />
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
import { getDictLabel, getIntDictOptions } from '@/hooks/useDict'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const formData = reactive<Record<string, any>>({
  code: undefined,
  name: undefined,
  type: undefined,
  status: undefined,
}) // 搜索表单数据
const stockTakingTypeOptions = computed(() => getIntDictOptions(DICT_TYPE.MES_WM_STOCK_TAKING_TYPE))
const statusOptions = computed(() => getIntDictOptions(DICT_TYPE.COMMON_STATUS))

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.code) {
    conditions.push(`编码:${formData.code}`)
  }
  if (formData.name) {
    conditions.push(`名称:${formData.name}`)
  }
  if (formData.type != null && formData.type !== -1) {
    conditions.push(`类型:${getDictLabel(DICT_TYPE.MES_WM_STOCK_TAKING_TYPE, formData.type)}`)
  }
  if (formData.status != null && formData.status !== -1) {
    conditions.push(`状态:${getDictLabel(DICT_TYPE.COMMON_STATUS, formData.status)}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索盘点方案'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    ...formData,
    type: formData.type === -1 ? undefined : formData.type,
    status: formData.status === -1 ? undefined : formData.status,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.code = undefined
  formData.name = undefined
  formData.type = undefined
  formData.status = undefined
  visible.value = false
  emit('reset')
}
</script>
