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
          企业名称
        </view>
        <wd-input v-model="formData.name" placeholder="请输入企业名称" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          企业编号
        </view>
        <wd-input v-model="formData.code" placeholder="请输入企业编号" clearable />
      </view>
      <yd-search-picker v-model="formData.type" label="企业类型" :dict-type="DICT_TYPE.WMS_MERCHANT_TYPE" all-option />
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
  code: undefined as string | undefined,
  type: undefined as number | undefined,
}) // 搜索表单数据

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.name) {
    conditions.push(`名称:${formData.name}`)
  }
  if (formData.code) {
    conditions.push(`编号:${formData.code}`)
  }
  if (formData.type !== undefined) {
    conditions.push(`类型:${getDictLabel(DICT_TYPE.WMS_MERCHANT_TYPE, formData.type)}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索往来企业'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    ...formData,
    type: formData.type,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.name = undefined
  formData.code = undefined
  formData.type = undefined
  visible.value = false
  emit('reset')
}
</script>
