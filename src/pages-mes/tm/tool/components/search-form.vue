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
          工具编码
        </view>
        <wd-input v-model="formData.code" placeholder="请输入工具编码" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          工具名称
        </view>
        <wd-input v-model="formData.name" placeholder="请输入工具名称" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          品牌
        </view>
        <wd-input v-model="formData.brand" placeholder="请输入品牌" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          型号规格
        </view>
        <wd-input v-model="formData.specification" placeholder="请输入型号规格" clearable />
      </view>
      <yd-search-picker v-model="formData.toolTypeId" label="工具类型" :columns="typeOptions" label-key="name" value-key="id" all-option />
      <yd-search-picker v-model="formData.status" label="状态" :dict-type="DICT_TYPE.MES_TM_TOOL_STATUS" all-option />
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
import type { TmToolType } from '@/api/mes/tm/tool/type'
import { computed, onMounted, reactive, ref } from 'vue'
import { getDictLabel } from '@/hooks/useDict'
import { getToolTypeSimpleList } from '@/api/mes/tm/tool/type'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'

const emit = defineEmits<{ search: [data: Record<string, any>], reset: [] }>()
const visible = ref(false) // 搜索弹窗显示状态
const typeOptions = ref<TmToolType[]>([]) // 工具类型选项
const formData = reactive({
  code: undefined as string | undefined,
  name: undefined as string | undefined,
  brand: undefined as string | undefined,
  specification: undefined as string | undefined,
  toolTypeId: -1,
  status: -1,
}) // 搜索表单数据
const placeholder = computed(() => { // 搜索条件展示文案
  const conditions: string[] = []
  if (formData.code) {
    conditions.push(`编码:${formData.code}`)
  }
  if (formData.name) {
    conditions.push(`名称:${formData.name}`)
  }
  if (formData.brand) {
    conditions.push(`品牌:${formData.brand}`)
  }
  if (formData.specification) {
    conditions.push(`规格:${formData.specification}`)
  }
  if (formData.toolTypeId !== -1) {
    conditions.push(`类型:${typeOptions.value.find(item => item.id === formData.toolTypeId)?.name || formData.toolTypeId}`)
  }
  if (formData.status !== -1) {
    conditions.push(`状态:${getDictLabel(DICT_TYPE.MES_TM_TOOL_STATUS, formData.status)}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索工具'
})

/** 加载工具类型选项 */
async function loadOptions() {
  typeOptions.value = await getToolTypeSimpleList() || []
}

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    code: formData.code || undefined,
    name: formData.name || undefined,
    brand: formData.brand || undefined,
    specification: formData.specification || undefined,
    toolTypeId: formData.toolTypeId === -1 ? undefined : formData.toolTypeId,
    status: formData.status === -1 ? undefined : formData.status,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.code = undefined
  formData.name = undefined
  formData.brand = undefined
  formData.specification = undefined
  formData.toolTypeId = -1
  formData.status = -1
  visible.value = false
  emit('reset')
}

/** 初始化 */
onMounted(() => {
  loadOptions()
})
</script>
