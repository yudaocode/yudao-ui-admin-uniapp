<template>
  <!-- 搜索框入口 -->
  <view @click="visible = true">
    <wd-search :placeholder="placeholder" hide-cancel disabled />
  </view>

  <!-- 搜索弹窗 -->
  <wd-popup v-model="visible" position="top" :custom-style="getTopPopupStyle()" :modal-style="getTopPopupModalStyle()" @close="visible = false">
    <view class="yd-search-form-container">
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          客户名称
        </view>
        <wd-input v-model="formData.name" placeholder="请输入客户名称" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          手机
        </view>
        <wd-input v-model="formData.mobile" placeholder="请输入手机" clearable />
      </view>
      <yd-search-picker v-model="formData.source" label="客户来源" :dict-type="DICT_TYPE.CRM_CUSTOMER_SOURCE" all-option />
      <yd-search-picker v-model="formData.industryId" label="客户行业" :dict-type="DICT_TYPE.CRM_CUSTOMER_INDUSTRY" all-option />
      <yd-search-picker v-model="formData.level" label="客户级别" :dict-type="DICT_TYPE.CRM_CUSTOMER_LEVEL" all-option />
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

const emit = defineEmits<{ search: [data: Record<string, any>], reset: [] }>()

const visible = ref(false) // 搜索弹窗显示状态
const formData = reactive<Record<string, any>>({
  name: undefined,
  mobile: undefined,
  source: undefined as number | undefined,
  industryId: undefined as number | undefined,
  level: undefined as number | undefined,
}) // 搜索表单数据
/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.name) {
    conditions.push(`名称:${formData.name}`)
  }
  if (formData.mobile) {
    conditions.push(`手机:${formData.mobile}`)
  }
  if (formData.source !== undefined) {
    conditions.push(`来源:${getDictLabel(DICT_TYPE.CRM_CUSTOMER_SOURCE, formData.source)}`)
  }
  if (formData.industryId !== undefined) {
    conditions.push(`行业:${getDictLabel(DICT_TYPE.CRM_CUSTOMER_INDUSTRY, formData.industryId)}`)
  }
  if (formData.level !== undefined) {
    conditions.push(`级别:${getDictLabel(DICT_TYPE.CRM_CUSTOMER_LEVEL, formData.level)}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索客户'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    name: formData.name,
    mobile: formData.mobile,
    source: formData.source,
    industryId: formData.industryId,
    level: formData.level,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.name = undefined
  formData.mobile = undefined
  formData.source = undefined
  formData.industryId = undefined
  formData.level = undefined
  visible.value = false
  emit('reset')
}
</script>
